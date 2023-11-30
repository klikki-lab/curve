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
    onChenged: g.Trigger<number> = new g.Trigger();

    /**
     * シークバーのトラッキング操作終了イベント。
     */
    onTrackingEnd: g.Trigger<number> = new g.Trigger();

    private knob: g.FilledRect;
    private _min: number = 0;
    private _max: number = 1;
    private _value: number = 0;

    constructor(scene: g.Scene, width: number, height: number) {
        super({
            scene: scene,
            width: width,
            height: height,
            touchable: true,
        });

        const bgBorder = new g.FilledRect({
            scene: scene,
            width: width - height,
            height: SeekBar.BACKGROUND_HEIGHT,
            cssColor: SeekBar.COLOR_NORMAL,
            x: height / 2,
            y: (height - SeekBar.BACKGROUND_HEIGHT) / 2,
        });
        new g.FilledRect({
            scene: scene,
            width: bgBorder.width - SeekBar.STROKE_WIDTH * 2,
            height: bgBorder.height - SeekBar.STROKE_WIDTH * 2,
            cssColor: SeekBar.COLOR_BORDER,
            x: SeekBar.STROKE_WIDTH,
            y: SeekBar.STROKE_WIDTH,
            parent: bgBorder,
        });
        this.append(bgBorder);

        this.knob = new g.FilledRect({
            scene: scene,
            width: height,
            height: height,
            cssColor: SeekBar.COLOR_BORDER,
        });
        const knobEntity = new g.FilledRect({
            scene: scene,
            width: this.knob.width - SeekBar.STROKE_WIDTH * 2,
            height: this.knob.height - SeekBar.STROKE_WIDTH * 2,
            cssColor: SeekBar.COLOR_NORMAL,
            x: SeekBar.STROKE_WIDTH,
            y: SeekBar.STROKE_WIDTH,
        });
        this.knob.append(knobEntity);
        this.append(this.knob);

        this.onPointDown.add(ev => {
            const ex = ev.point.x;
            if (this.trackProgress(ex)) {
                this.onChenged.fire(this.value);
            }
        });

        this.onPointMove.add(ev => {
            const ex = ev.startDelta.x + ev.point.x;
            if (this.trackProgress(ex)) {
                this.onChenged.fire(this.value);
            }
        });

        this.onPointUp.add(_ev => {
            const knobEntity = this.knob.children[0];
            if (knobEntity instanceof g.FilledRect) {
                knobEntity.cssColor = SeekBar.COLOR_NORMAL;
                knobEntity.modified();
            }
            this.onTrackingEnd.fire(this.value);
        });
    }

    private denormarize = (value: number) => value * (this._max - this._min) + this._min;

    private trackProgress = (ex: number): boolean => {
        const knobEntity = this.knob.children[0];
        if (knobEntity instanceof g.FilledRect && !this.isPressed(knobEntity)) {
            knobEntity.cssColor = SeekBar.COLOR_PRESSED;
            knobEntity.modified();
        }

        const x = Math.max(0, Math.min(this.width - this.knob.width, ex - this.knob.width / 2));
        const value = this.denormarize(x / (this.width - this.knob.width));
        if (this.value !== value) {
            this.value = value;
            return true;
        }
        return false;
    };

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