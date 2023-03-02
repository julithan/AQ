import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { GameObject, Quaternion, Collider, Vector3, WaitForSeconds } from 'UnityEngine'
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller'
import ClientStarter from './ClientStarter';

export default class MultiTelport extends ZepetoScriptBehaviour {


    private localPlayerCharacter: GameObject;
    private Starter: ClientStarter;
    private isMultiplayMode: boolean;

    private Start() {
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.localPlayerCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject;
        });

        if (null != this.Starter)
        {
            this.isMultiplayMode = true;
        }
    }

    private OnTriggerEnter(coll: Collider) {
        if (coll.gameObject != this.localPlayerCharacter) {
            return;
        }

        this.StartCoroutine(this.RespawnCharacter(coll.gameObject));
        if (this.isMultiplayMode) {
            this.Starter.SendOnFallTriggerEnter();
        }
    }

    private *RespawnCharacter(obj: GameObject) {
        let character = obj.GetComponent<ZepetoCharacter>();
        while (true) {
            if (obj.transform.position != Vector3.zero) {
                character.Teleport(Vector3.zero, Quaternion.identity);
                if (obj.transform.position.y > -1)
                    break;
            }
            yield new WaitForSeconds(0.3);
        }
    }

}