import { Collider, Vector3, Quaternion, GameObject, WaitForSeconds } from 'UnityEngine';
import { ZepetoWorldMultiplay } from 'ZEPETO.World'
import { ZepetoCharacter, ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import Starter from '../ZepetoScripts/Multiplay/ClientStarter';

export default class Teleport  extends ZepetoScriptBehaviour
{

    private zepetoCharacter: GameObject;
    
    Start() {
        //Zepeto character object
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.zepetoCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject;

            if (this.zepetoCharacter == null)
                console.log(`[zepetoCharacter] check`);

        });
    }

    OnTriggerEnter(coll: Collider) {

        console.log(`[collider] check`);
        //if (this.zepetoCharacter == null || collider.gameObject != this.zepetoCharacter.gameObject)
        //if (this.zepetoCharacter == null)
        //    console.log(`this.zepetoCharacter == null`);
        //return;
        //if (collider.gameObject != this.zepetoCharacter.gameObject)
        //    console.log(`collider.gameObject != this.zepetoCharacter.gameObject`);
        //return;

        
        //Teleport to Origin Position
        //this.zepetoCharacter.Teleport(new Vector3(762.0, 20.0, 150.0), Quaternion.identity);
        //const player = new Starter();
        //player.SendTeleport(new Vector3(762.0, 20.0, 150.0));

        if (coll.gameObject != this.zepetoCharacter) {
            return;
        }
        this.StartCoroutine(this.RespawnCharacter(coll.gameObject));
    }

    private *RespawnCharacter(obj: GameObject) {
        let character = obj.GetComponent<ZepetoCharacter>();
        while (true) {
            if (obj.transform.position != Vector3.zero) {
                //character.Teleport(Vector3.zero, Quaternion.identity);
                character.Teleport(new Vector3(898.0, 20.0, 232.0), Quaternion.identity);
                if (obj.transform.position.y > -1)
                    break;
            }
            yield new WaitForSeconds(0.3);
        }
    }
}