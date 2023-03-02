import { Canvas, AnimationClip, WaitForSeconds } from 'UnityEngine';
import { ZepetoPlayers, ZepetoCharacter } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { Button } from "UnityEngine.UI";



export default class interactionObject extends ZepetoScriptBehaviour {

    public danceButton: Button;
    private zepetoCharacter: ZepetoCharacter;
    public animationClip: AnimationClip;


    Start() {
        //create character
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.zepetoCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        });
        // when button click
        this.danceButton.onClick.AddListener(() => {
            //start gesture
            this.zepetoCharacter.SetGesture(this.animationClip);
            //this.StartCoroutine(this.DoRoutine());
        });
    }

    //after 3 seconds later, stop gesture
    *DoRoutine() {
        yield new WaitForSeconds(3);
        this.zepetoCharacter.CancelGesture();
    }
}