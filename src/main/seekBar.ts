export class SeekBar extends g.E {

    private static readonly COLOR_NORMAL = "white";
    private static readonly COLOR_PRESSED = "orange";
    private static readonly COLOR_BORDER = "black";
    private static readonly BACKGROUND_HEIGHT = 8;
    private static readonly STROKE_WIDTH = 2;

    /**
     * 値の変更イベント。シークバーが操作された時の値を渡す。
     * 最大値と最小値がデフォルト値のままであれば 0.0 - 1.0、設定していればそれらを考慮した実数を受け取る。
     */
    onChanged: g.Trigger<number> = new g.Trigger();

    /**
     * シークバーのトラッキング操作終了イベント。
     */
    onTrackingEnd: g.Trigger<number> = new g.Trigger();

    private knob: g.FilledRect;
    private firstTouchPlayerId: string = undefined;

    constructor(
        scene: g.Scene,
        width: number,
        height: number,
        private _value: number = 0,
        private _min: number = 0,
        private _max: number = 1) {

        super({
            scene: scene,
            width: Math.max(width, SeekBar.BACKGROUND_HEIGHT * 4),
            height: Math.max(height, SeekBar.BACKGROUND_HEIGHT * 2),
            touchable: true,
        });

        if (_min >= _max) {
            throw new RangeError(`max=${_max} が min=${_min} より小さい`);
        }

        const createBackgroundBar = (): g.FilledRect => {
            const backgroundBar = new g.FilledRect({
                scene: scene,
                width: this.width - this.height,
                height: SeekBar.BACKGROUND_HEIGHT,
                cssColor: SeekBar.COLOR_NORMAL,
                x: this.height / 2,
                y: (this.height - SeekBar.BACKGROUND_HEIGHT) / 2,
            });
            new g.FilledRect({
                scene: scene,
                width: backgroundBar.width - SeekBar.STROKE_WIDTH * 2,
                height: backgroundBar.height - SeekBar.STROKE_WIDTH * 2,
                cssColor: SeekBar.COLOR_BORDER,
                x: SeekBar.STROKE_WIDTH,
                y: SeekBar.STROKE_WIDTH,
                parent: backgroundBar,
            });
            return backgroundBar;
        };
        this.append(createBackgroundBar());

        const createKnob = (): g.FilledRect => {
            const knob = new g.FilledRect({
                scene: scene,
                width: this.height,
                height: this.height,
                cssColor: SeekBar.COLOR_BORDER,
            });
            new g.FilledRect({
                scene: scene,
                width: knob.width - SeekBar.STROKE_WIDTH * 2,
                height: knob.height - SeekBar.STROKE_WIDTH * 2,
                cssColor: SeekBar.COLOR_NORMAL,
                x: SeekBar.STROKE_WIDTH,
                y: SeekBar.STROKE_WIDTH,
                parent: knob,
            });
            return knob;
        };
        this.append(this.knob = createKnob());

        this.onPointDown.add(ev => {
            if (this.firstTouchPlayerId) return;

            this.firstTouchPlayerId = ev.player.id;
            const ex = ev.point.x;
            if (this.trackProgress(ex)) {
                this.onChanged.fire(this.value);
            }
        });

        this.onPointMove.add(ev => {
            if (this.firstTouchPlayerId !== ev.player.id) return;

            const ex = ev.startDelta.x + ev.point.x;
            if (this.trackProgress(ex)) {
                this.onChanged.fire(this.value);
            }
        });

        this.onPointUp.add(ev => {
            if (this.firstTouchPlayerId !== ev.player.id) return;

            this.firstTouchPlayerId = undefined;
            const knob = this.knob.children[0];
            if (knob instanceof g.FilledRect) {
                knob.cssColor = SeekBar.COLOR_NORMAL;
                knob.modified();
            }
            this.onTrackingEnd.fire(this.value);
        });
    }

    /**
     * @param ex タッチした X 座標
     * @returns 値に変更があれば true、そうでなければ false
     */
    private trackProgress = (ex: number): boolean => {
        const knob = this.knob.children[0];
        if (knob instanceof g.FilledRect && !this.isPressed(knob)) {
            knob.cssColor = SeekBar.COLOR_PRESSED;
            knob.modified();
        }

        const x = Math.max(0, Math.min(this.width - this.knob.width, ex - this.knob.width / 2));
        const value = this.denormarize(x / (this.width - this.knob.width));
        if (this.value !== value) {
            this.value = value;
            return true;
        }
        return false;
    };

    /**
     * @param value 値
     * @returns min と max を考慮した値
     */
    private denormarize = (value: number) => value * (this._max - this._min) + this._min;

    private isPressed = (knobEntity: g.FilledRect): boolean => knobEntity.cssColor === SeekBar.COLOR_PRESSED;

    get min(): number { return this._min; }

    /**
     * 最小値をセットする。デフォルトは 0。最大値より大きい値を指定すると `RangeError` を投げる。
     * @param min 最小値
     */
    set min(min: number) {
        if (min > this._max) {
            throw new RangeError(`min=${min} が max=${this._max} より大きい`);
        }

        this._min = min;
        if (min > this._value) {
            this.value = min;
        }
    }

    get max(): number { return this._max; }

    /**
     * 最大値をセットする。デフォルトは 1。最小値より小さい値を指定すると `RangeError` を投げる。
     * @param max 最大値
     */
    set max(max: number) {
        if (max < this._min) {
            throw new RangeError(`max=${max} が min=${this._min} より小さい`);
        }

        this._max = max;
        if (max < this._value) {
            this.value = max;
        }
    }

    get value() { return this.denormarize(this._value); }

    set value(value: number) {
        let relativeValue: number;
        if (value < this._min) {
            relativeValue = this._min;
        } else if (value > this._max) {
            relativeValue = this._max;
        } else {
            relativeValue = value;
        }
        this._value = (relativeValue - this._min) / (this._max - this._min);

        const x = (this.width - this.knob.width) * this._value;
        this.knob.x = x;
        this.knob.modified();
    }
}