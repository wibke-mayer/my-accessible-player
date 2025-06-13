import { Component, h, State, Prop } from '@stencil/core';

@Component({
  tag: 'my-accessible-player',
  styleUrl: 'my-accessible-player.css',
  shadow: true,
})
export class MyAccessiblePlayer {
  @Prop() src: string;
  @Prop() poster: string;
  @Prop() fallbackSrc: string;
  @Prop() transcript: string;

  @Prop() subtitles: string;   // JSON array string
  @Prop() descriptions: string;

  @State() data: Array<{start:number,text:string}> = [];
  @State() currentTime = 0;
  @State() hasError = false;

  private mediaEl!: HTMLMediaPlayerElement;
  private subs = [];
  private ads = [];

  async componentWillLoad() {
    this.subs = JSON.parse(this.subtitles || '[]');
    this.ads = JSON.parse(this.descriptions || '[]');

    if (this.transcript?.endsWith('.vtt')) {
      const vtt = await fetch(this.transcript).then(r => r.text());
      this.data = vtt.split('\n\n').map(block => {
        const [time, ...rest] = block.trim().split('\n');
        const [start] = time.split(' --> ');
        const [h,m,s] = start.split(':');
        const sec = +h*3600 + +m*60 + +s;
        return { start: sec, text: rest.join(' ') };
      });
    }
  }

  componentDidLoad() {
    this.mediaEl.addEventListener('time-update', (e: any) => this.currentTime = e.detail.currentTime);
    this.mediaEl.addEventListener('error', () => {
      if (this.fallbackSrc) {
        this.mediaEl.src = this.fallbackSrc;
        this.hasError = true;
      }
    });
  }

  seek(t: number) {
    this.mediaEl.currentTime = t;
    this.mediaEl.play();
  }

  render() {
    return (
      <div>
        <media-player
          ref={el => (this.mediaEl = el!)}
          title="Barrierefreier Livestream"
          src={this.src}
          stream-type="live"
          poster={this.poster}
          controls playsinline crossorigin="anonymous">
          <media-provider />
          {this.subs.map(s =>
            <track kind="subtitles" label={s.label} src={s.src} srcLang={s.lang} />
          )}
          {this.ads.map(a =>
            <track kind="descriptions" label={a.label} src={a.src} srcLang={a.lang} />
          )}
          <media-poster alt="Vorschau" />
          <media-loading-indicator />
          <media-controls>
            <media-play-button />
            <media-mute-button />
            <media-volume-range />
            <media-captions-button />
            <media-fullscreen-button />
          </media-controls>
        </media-player>

        {this.hasError && <div class="fallback">Fallback-Stream aktiv.</div>}

        {this.data.length > 0 && (
          <section class="transcript" aria-labelledby="transcript-title">
            <h2 id="transcript-title">Synchronisiertes Transkript</h2>
            <ul>
              {this.data.map((d) =>
                <li class={this.currentTime >= d.start ? 'active' : ''}
                    onClick={() => this.seek(d.start)}>
                  {d.text}
                </li>
              )}
            </ul>
          </section>
        )}
      </div>
    );
  }
}
