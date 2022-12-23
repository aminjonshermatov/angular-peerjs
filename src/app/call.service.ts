import {Injectable} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import Peer from 'peerjs';
import {BehaviorSubject, Subject} from 'rxjs';
import {v4 as uuidv4} from 'uuid';

@Injectable()
export class CallService {

  private peer: Peer;
  private mediaCall: Peer.MediaConnection;
  private readonly localStreamBSub$: BehaviorSubject<MediaStream> = new BehaviorSubject(null);
  public readonly localStream$ = this.localStreamBSub$.asObservable();
  private readonly remoteStreamBSub$: BehaviorSubject<MediaStream> = new BehaviorSubject(null);
  public readonly remoteStream$ = this.remoteStreamBSub$.asObservable();

  private isCallStartedBs = new Subject<boolean>();
  public isCallStarted$ = this.isCallStartedBs.asObservable();

  constructor(private snackBar: MatSnackBar) { }

  public initPeer(): string {
    if (!this.peer || this.peer.disconnected) {
      const peerJsOptions: Peer.PeerJSOption = {
        config: {
          iceServers: [
            {
              urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
              ],
            }
          ]
        }
      };
      try {
        const id = uuidv4();
        this.peer = new Peer(id, peerJsOptions);
        return id;
      } catch (error) {
        console.error(error);
      }
    }
  }

  public async establishMediaCall(remotePeerId: string) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video: { width: 1280, height: 720 }, audio: true});

      const connection = this.peer.connect(remotePeerId);
      connection.on('error', err => this.snackBar.open(err, 'Close'));

      this.mediaCall = this.peer.call(remotePeerId, stream);
      if (!this.mediaCall) {
        const errorMessage = 'Unable to connect to remote peer';
        this.snackBar.open(errorMessage, 'Close');
        throw new Error(errorMessage);
      }
      this.localStreamBSub$.next(stream);
      this.isCallStartedBs.next(true);

      this.mediaCall.on('stream', (remoteStream) => this.remoteStreamBSub$.next(remoteStream));
      this.mediaCall.on('error', err => {
        this.snackBar.open(err, 'Close');
        this.isCallStartedBs.next(false);
      });
      this.mediaCall.on('close', () => this.onCallClose());
    } catch (ex) {
      console.error(ex);
      this.snackBar.open(ex, 'Close');
      this.isCallStartedBs.next(false);
    }
  }

  public async enableCallAnswer() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video: { width: 1280, height: 720 }, audio: true});
      this.localStreamBSub$.next(stream);
      this.peer.on('call', async (call) => {
        this.mediaCall = call;
        this.isCallStartedBs.next(true);

        this.mediaCall.answer(stream);
        this.mediaCall.on('stream', (remoteStream) => this.remoteStreamBSub$.next(remoteStream));
        this.mediaCall.on('error', err => {
          this.snackBar.open(err, 'Close');
          this.isCallStartedBs.next(false);
          console.error(err);
        });
        this.mediaCall.on('close', () => this.onCallClose());
      });
    } catch (ex) {
      console.error(ex);
      this.snackBar.open(ex, 'Close');
      this.isCallStartedBs.next(false);
    }
  }

  private onCallClose() {
    this.remoteStreamBSub$?.value.getTracks().forEach(track => track.stop());
    this.localStreamBSub$?.value.getTracks().forEach(track => track.stop());
    this.snackBar.open('Call Ended', 'Close');
  }

  public closeMediaCall() {
    this.mediaCall?.close();
    if (!this.mediaCall) {
      this.onCallClose();
    }
    this.isCallStartedBs.next(false);
  }

  public destroyPeer() {
    this.mediaCall?.close();
    this.peer?.disconnect();
    this.peer?.destroy();
  }
}
