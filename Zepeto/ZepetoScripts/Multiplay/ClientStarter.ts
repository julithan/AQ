import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {ZepetoWorldMultiplay} from 'ZEPETO.World'
import { Room, RoomData } from 'ZEPETO.Multiplay'
import CharacterEventChecker from './CharacterEventChecker';
import {Player, State, Vector3} from 'ZEPETO.Multiplay.Schema'
import {CharacterState, SpawnInfo, ZepetoPlayers, ZepetoPlayer} from 'ZEPETO.Character.Controller'
import * as UnityEngine from "UnityEngine";



export default class Starter extends ZepetoScriptBehaviour {

    public multiplay: ZepetoWorldMultiplay;
    public light: UnityEngine.GameObject;

    private room: Room;
    private currentPlayers: Map<string, Player> = new Map<string, Player>();

    private allowablePosDiff: number = 5;


    private MESSAGE_TYPE_ServerTimestamp = "ServerTimestamp";
    private MESSAGE_TYPE_OnBlockTriggerEnter = "OnBlockTriggerEnter";
    private MESSAGE_TYPE_OnCharacterLandedBlock = "OnCharacterLandedBlock";
    private MESSAGE_TYPE_OnCharacterJumpOnBlock = "OnCharacterJumpOnBlock";
    private MESSAGE_TYPE_OnTryJump = "OnTryJump";
    private MESSAGE_TYPE_OnPlatformState = "OnPlatformState";
    private MESSAGE_TYPE_OnFallTriggerEnter = "OnFallTriggerEnter";
    private MESSAGE_TYPE_OnTryJumpForMovingToBlock = "OnTryJumpForMovingToBlock";
    private MESSAGE_TYPE_OnLeavePlayer = "OnLeavePlayer";
    private MESSAGE_TYPE_ServerDayandNight = "ServerDayandNight";
    private MESSAGE_TYPE_OnDayandNight = "OnDayandNight";

    private Start() {

        this.multiplay.RoomCreated += (room: Room) => {
            this.room = room;
            this.AddMessageHandlersForCharacterSync();
        };

        this.multiplay.RoomJoined += (room: Room) => {
            room.OnStateChange += this.OnStateChange;
        };

        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject.AddComponent<CharacterEventChecker>();
        });

        this.StartCoroutine(this.SendMessageLoop(0.1));
    }

    // Send the local character transform to the server at the scheduled Interval Time.
    private* SendMessageLoop(tick: number) {
        while (true) {
            yield new UnityEngine.WaitForSeconds(tick);

            if (this.room != null && this.room.IsConnected) {
                //this.SendRotate(this.light.transform);
                const hasPlayer = ZepetoPlayers.instance.HasPlayer(this.room.SessionId);
                if (hasPlayer) {
                    const myPlayer = ZepetoPlayers.instance.GetPlayer(this.room.SessionId);
                    if (myPlayer.character.CurrentState != CharacterState.Idle)
                        this.SendTransform(myPlayer.character.transform);
                        this.SendTransform(this.light.transform);
                }
            }
        }
    }

    private OnStateChange(state: State, isFirst: boolean) {

        // When the first OnStateChange event is received, a full state snapshot is recorded.
        if (isFirst) {

            // [CharacterController] (Local) Called when the Player instance is fully loaded in Scene
            ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
                const myPlayer = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer;

                myPlayer.character.OnChangedState.AddListener((cur, prev) => {
                    this.SendState(cur);
                });
            });

            // [CharacterController] Called when the Player instance is fully loaded in Scene
            ZepetoPlayers.instance.OnAddedPlayer.AddListener((sessionId: string) => {
                const isLocal = this.room.SessionId === sessionId;
                if (!isLocal) {
                    const player: Player = this.currentPlayers.get(sessionId);

                    // [RoomState] Called whenever the state of the player instance is updated. 
                    player.OnChange += (changeValues) => this.OnUpdatePlayer(sessionId, player);
                }
            });
        }

        let join = new Map<string, Player>();
        let leave = new Map<string, Player>(this.currentPlayers);

        state.players.ForEach((sessionId: string, player: Player) => {
            if (!this.currentPlayers.has(sessionId)) {
                join.set(sessionId, player);
            }
            leave.delete(sessionId);
        });

        // [RoomState] Create a player instance for players that enter the Room
        join.forEach((player: Player, sessionId: string) => this.OnJoinPlayer(sessionId, player));

        // [RoomState] Remove the player instance for players that exit the room
        leave.forEach((player: Player, sessionId: string) => this.OnLeavePlayer(sessionId, player));
    }

    private OnJoinPlayer(sessionId: string, player: Player) {
        console.log(`[OnJoinPlayer] players - sessionId : ${sessionId}`);
        this.currentPlayers.set(sessionId, player);

        const spawnInfo = new SpawnInfo();
        //player.transform.position.y = 3;
        const position = this.ParseVector3(player.transform.position); // player.transform.position
        const rotation = this.ParseVector3(player.transform.rotation);
        spawnInfo.position = new UnityEngine.Vector3(98, 20, 881);
        spawnInfo.rotation = UnityEngine.Quaternion.Euler(rotation);

        const isLocal = this.room.SessionId === player.sessionId;
        ZepetoPlayers.instance.CreatePlayerWithUserId(sessionId, player.zepetoUserId, spawnInfo, isLocal);
    }

    private OnLeavePlayer(sessionId: string, player: Player) {
        console.log(`[OnRemove] players - sessionId : ${sessionId}`);
        this.currentPlayers.delete(sessionId);

        ZepetoPlayers.instance.RemovePlayer(sessionId);
    }

    private OnUpdatePlayer(sessionId: string, player: Player) {

        const position = this.ParseVector3(player.transform.position);

        const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(sessionId);
        zepetoPlayer.character.MoveToPosition(position);

        //this.SendRotate(this.light.transform);

        if (player.state === CharacterState.JumpIdle || player.state === CharacterState.JumpMove)
            zepetoPlayer.character.Jump();

        // Scene에서의 캐릭터의 위치와 서버에서의 캐릭터 위치가 허용값 보다 많이 차이날 경우 Teleport 합니다.
        if (UnityEngine.Vector3.Distance(zepetoPlayer.character.transform.position, position) > this.allowablePosDiff) {
            zepetoPlayer.character.transform.position = position;
            console.log(`[OnUpdatePlayer] Teleport`);
            return;
        }
    }

    private SendTransform(transform: UnityEngine.Transform) {
        const data = new RoomData();

        const pos = new RoomData();
        pos.Add("x", transform.localPosition.x);
        pos.Add("y", transform.localPosition.y);
        pos.Add("z", transform.localPosition.z);
        data.Add("position", pos.GetObject());

        const rot = new RoomData();
        rot.Add("x", transform.localEulerAngles.x);
        rot.Add("y", transform.localEulerAngles.y);
        rot.Add("z", transform.localEulerAngles.z);
        data.Add("rotation", rot.GetObject());
        this.room.Send("onChangedTransform", data.GetObject());
    }

    private SendRotate(transform: UnityEngine.Transform) {
        const data = new RoomData();

        const rot = new RoomData();
        rot.Add("x", transform.localEulerAngles.x);
        rot.Add("y", transform.localEulerAngles.y);
        rot.Add("z", transform.localEulerAngles.z);
        data.Add("rotation", rot.GetObject());
        this.room.Send("onChangedRotate", data.GetObject());

    }

    private SendState(state: CharacterState) {
        const data = new RoomData();
        data.Add("state", state);
        this.room.Send("onChangedState", data.GetObject());
    }

    private ParseVector3(vector3: Vector3): UnityEngine.Vector3 {
        return new UnityEngine.Vector3
        (
            vector3.x,
            vector3.y,
            vector3.z
        );
    }

    public SendTeleport(pos: UnityEngine.Vector3) {
        console.log(`[SendTeleport] check`);
        console.log(`[SendTeleport] players - sessionId : ${this.room.SessionId}`);
        if (this.room != null && this.room.IsConnected) {
            const hasPlayer = ZepetoPlayers.instance.HasPlayer(this.room.SessionId);
            if (hasPlayer) {
                console.log(`[hasPlayer] check`);
                const myPlayer = ZepetoPlayers.instance.GetPlayer(this.room.SessionId);
                if (myPlayer.character.CurrentState != CharacterState.Idle)
                    console.log(`[myPlayer.character.CurrentState != CharacterState.Idle] check`);
                myPlayer.character.Teleport(pos, UnityEngine.Quaternion.identity);
                this.SendTransform(myPlayer.character.transform);
            }
        }
        else
        {
            const hasPlayer = ZepetoPlayers.instance.HasPlayer(this.room.SessionId);
            if (hasPlayer) {
                console.log(`[else hasPlayer] check`);
                const myPlayer = ZepetoPlayers.instance.GetPlayer(this.room.SessionId);
                myPlayer.character.Teleport(pos, UnityEngine.Quaternion.identity);
            }
        }
    }

    private AddMessageHandlersForCharacterSync() {

        // Send a message for when the characte ralls off the block. 
        this.room.AddMessageHandler(this.MESSAGE_TYPE_OnFallTriggerEnter, (message: string) => {
            const sessionId: string = message.toString();
            const hasPlayer = ZepetoPlayers.instance.HasPlayer(sessionId);
            // Character respawn. 
            if (hasPlayer) {
                this.StartCoroutine(this.RespwanCharacter(sessionId));
            }
        });
    }

    /*
    When the character falls, respawn the character at the respawn point. 
    */
    private *RespwanCharacter(sessionId: string) {
        const myPlayer = ZepetoPlayers.instance.GetPlayer(sessionId);
        myPlayer.character.enabled = false;
        while (true) {
            myPlayer.character.gameObject.transform.SetPositionAndRotation(new UnityEngine.Vector3(762.0, 20.0, 150.0), 
                UnityEngine.Quaternion.identity);
            myPlayer.character.enabled = true;
            yield null;
        }
    }


    // ------------------------ Funcions Necessary for sending messages to the server ------------------------
    /* SendOnTryJumpForMovingToBlock()
       - When the character attemps a move from a platform to a moving block.
    */
    public SendOnTryJumpForMovingToBlock(position: Vector3, platformPosition: Vector3) {
        const data = new RoomData();
        const relativePos = new RoomData();
        const platformPos = new RoomData();

        relativePos.Add("x", position.x);
        relativePos.Add("y", position.y);
        relativePos.Add("z", position.z);
        data.Add("relativePos", relativePos.GetObject());

        platformPos.Add("x", platformPosition.x);
        platformPos.Add("y", platformPosition.y);
        platformPos.Add("z", platformPosition.z);
        data.Add("platformPos", platformPos.GetObject());

        this.room.Send(this.MESSAGE_TYPE_OnTryJumpForMovingToBlock, data.GetObject());
    }

    /* SendOnBlockTriggerEnter() 
       - When the enters a moving block trigger. 
    */
    public SendOnBlockTriggerEnter(blockIdx: number) {
        this.room.Send(this.MESSAGE_TYPE_OnBlockTriggerEnter, blockIdx);
    }

    /* SendOnBlockTriggerExit() 
       - When the player exits a moving block trigger. 
    */
    public SendOnBlockTriggerExit(blockIdx: number, relativePosition: Vector3) {
        const data = new RoomData();
        data.Add("blockIdx", blockIdx);

        const relativePos = new RoomData();
        relativePos.Add("x", relativePosition.x);
        relativePos.Add("y", relativePosition.y);
        relativePos.Add("z", relativePosition.z);

        data.Add("relativePos", relativePos.GetObject());

        this.room.Send(this.MESSAGE_TYPE_OnCharacterJumpOnBlock, data.GetObject());
    }

    /* SendOnLandedBlock() 
       - Send relative position vectors when the local player lands on a block.
    */
    public SendOnLandedBlock(blockIdx: number, relativeVector: Vector3) {
        const data = new RoomData();
        data.Add("blockIdx", blockIdx);

        const relativePos = new RoomData();
        relativePos.Add("x", relativeVector.x);
        relativePos.Add("y", relativeVector.y);
        relativePos.Add("z", relativeVector.z);
        data.Add("relativePos", relativePos.GetObject());

        this.room.Send(this.MESSAGE_TYPE_OnCharacterLandedBlock, data.GetObject());
    }

    /* SendOnPlatformState() 
       - When the local character lands on a platform, send the relative position as a vector.
    */
    public SendOnPlatformState() {
        this.room.Send(this.MESSAGE_TYPE_OnPlatformState);
    }

    /* SendOnFallTriggerEnter() 
       - When the local character falls, send a message to the server. 
    */
    public SendOnFallTriggerEnter() {
        this.room.Send(this.MESSAGE_TYPE_OnFallTriggerEnter);
        console.log(`[multi SendOnFallTriggerEnter Room.Send() ]`);
    }

    /* SendTryJump() 
       - Whent he local character jumps from a block. 
    */
    public SendTryJump(isJumping: boolean) {
        this.room.Send(this.MESSAGE_TYPE_OnTryJump, isJumping);
    }

}
