import { Collider, Vector3, Quaternion } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class testchagne extends ZepetoScriptBehaviour {

    public rotationSpeedX: number = 0.1;
    public rotationSpeedY: number = 0;
    public rotationSpeedZ: number = 0;

    Update() {
        this.transform.Rotate(this.rotationSpeedX, this.rotationSpeedY, this.rotationSpeedZ);
    }

    Start() {

    }

}