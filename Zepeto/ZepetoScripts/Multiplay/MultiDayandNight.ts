import { CharacterController, Collider, Mathf, Quaternion, Random, Renderer, Rigidbody, Time, Transform, Vector3 } from 'UnityEngine';
import { Text } from 'UnityEngine.UI'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { CharacterState, ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller'

export default class MultiDayandNight extends ZepetoScriptBehaviour {

    // Light orbit variables
    @Header("DayandNight")
    public rotSpeed: number = 0.1;
    public rotatingPoint: Transform;
    public characterSpeedControlValue: number = 6;

    // Multiplayer Sync Variables
    private isMultiplayMode: boolean = false;
    private syncCharacterTransforms: Map<string, Transform> = new Map<string, Transform>();
    private myIdx: number = 0;

    private isLocalPlayerOnBlock: boolean = false;

    private rotateAroundAxis: Vector3;

    public eulerAngleVelocity: Vector3;


    Start() {    

    }

    /* RotateLight() 
    - Rotate block if the block rotation option is on
*/
    private rotatelight() {
        //let deltaRotation: Quaternion = Quaternion.Euler(this.eulerAngleVelocity * Time.fixedDeltaTime);
        //this.transform.Rotate(this.rotatingPoint.position, this.rotateAroundAxis, this.rotSpeed * Time.deltaTime);
        this.transform.Rotate(this.rotSpeed * Time.deltaTime, 0, 0);
    }


    Update() {

        // Block orbit
        //this.transform.RotateAround(this.rotatingPoint.position, this.rotateAroundAxis, this.rotSpeed * Time.deltaTime);
        this.rotatelight();
    }

}