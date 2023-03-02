import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { SpawnInfo, ZepetoPlayers } from "ZEPETO.Character.Controller";
import { Quaternion, Vector3 } from "UnityEngine";


export default class CharacterController extends ZepetoScriptBehaviour {

    Start() {

        var spawninfo = new SpawnInfo();
        spawninfo.position = new Vector3(98, 20, 881);
        //spawninfo.position = new Vector3(0, 20, 0);
        spawninfo.rotation = Quaternion.Euler(0, 180, 0);

        ZepetoPlayers.instance.CreatePlayerWithZepetoId("", "julithan", spawninfo, true);
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            let _player= ZepetoPlayers.instance.LocalPlayer;
        });
    } 
}