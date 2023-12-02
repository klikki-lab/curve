import { GameMainParameterObject } from "./../parameterObject";
import { FontSize } from "./fontSize";
import { Entity } from "./entity";
import { SeekBar } from "./seekBar";

interface Snapshot {
    speed: number,
    scale: number,
    objectCount: number,
    opacity: number,
    bgOpacity: number,
}

export class MainScene extends g.Scene {

    private static readonly MIN_OBJECT_SIZE = 32;
    private static readonly OBJECT_SIZE = 8 * 4;

    private objects: g.E;
    private speedSeekbar: SeekBar;
    private scaleSeekbar: SeekBar;
    private objectCountSeekbar: SeekBar;
    private opacitySeekbar: SeekBar;
    private bgOopacitySeekbar: SeekBar;
    private fpsLabel: g.Label;

    constructor(param: GameMainParameterObject) {
        super({ game: g.game });

        const snapshot: Snapshot = param.snapshot || {};

        this.setInterval(() => {
            g.game.raiseEvent(new g.MessageEvent({ type: "SNAPSHOT" }));
        }, 1000 * 60);

        this.onMessage.add((ev: g.MessageEvent) => {
            if (ev.data?.type === "SNAPSHOT") {
                g.game.requestSaveSnapshot(() => {
                    const snapshot: Snapshot = {
                        speed: this.speedSeekbar.value,
                        scale: this.scaleSeekbar.value,
                        objectCount: this.objectCountSeekbar.value,
                        opacity: this.opacitySeekbar.value,
                        bgOpacity: this.bgOopacitySeekbar.value,
                    };
                    return { snapshot: snapshot };
                });
            }
        });

        this.onLoad.add(_scene => {
            const bg = new g.FilledRect({
                scene: _scene,
                width: g.game.width,
                height: g.game.height,
                cssColor: "black",
                opacity: snapshot.bgOpacity ?? 1,
            });
            this.append(bg);

            const font = new g.DynamicFont({
                game: g.game,
                fontFamily: "sans-serif",
                fontWeight: "bold",
                strokeWidth: FontSize.MEDIUM / 4,
                strokeColor: "black",
                fontColor: "white",
                size: FontSize.MEDIUM,
            });

            const versionLabel = new g.Label({
                scene: this,
                text: `Version ${g.game.vars.version}`,
                font: font,
                fontSize: FontSize.SMALL,
            });
            versionLabel.x = g.game.width - versionLabel.width - FontSize.SMALL * .5;
            versionLabel.y = g.game.height - versionLabel.height - FontSize.SMALL * .5;
            this.append(versionLabel);

            this.fpsLabel = new g.Label({
                scene: this,
                text: `FPS ${g.game.fps.toFixed(2)}`,
                font: font,
                fontSize: FontSize.SMALL,
            });
            this.fpsLabel.x = versionLabel.x - this.fpsLabel.width - FontSize.SMALL * 4;
            this.fpsLabel.y = versionLabel.y;
            this.append(this.fpsLabel);

            const seekBarWidth = 160;
            const seekBarHeight = 32;

            const speedLabel = new g.Label({
                scene: this,
                text: "速さ",
                font: font,
                x: g.game.width - seekBarWidth * 1.5,
                y: seekBarHeight * 3,
            });
            this.append(speedLabel);

            this.speedSeekbar = new SeekBar(this, seekBarWidth, seekBarHeight);
            this.speedSeekbar.min = 1;
            this.speedSeekbar.max = 100;
            this.speedSeekbar.value = snapshot.speed ?? 1;
            this.speedSeekbar.x = speedLabel.x;
            this.speedSeekbar.y = speedLabel.y + speedLabel.height + seekBarHeight * 0.5;
            this.speedSeekbar.onChenged.add(value => { speed = value; });
            speed = this.speedSeekbar.value;
            this.append(this.speedSeekbar);

            const scaleLabel = new g.Label({
                scene: this,
                text: "大きさ",
                font: font,
                x: g.game.width - seekBarWidth * 1.5,
                y: this.speedSeekbar.y + this.speedSeekbar.height * 2,
            });
            this.append(scaleLabel);

            this.scaleSeekbar = new SeekBar(this, seekBarWidth, seekBarHeight);
            this.scaleSeekbar.max = 2;
            this.scaleSeekbar.min = 0.05;
            this.scaleSeekbar.value = snapshot.scale ?? .05;
            this.scaleSeekbar.x = scaleLabel.x;
            this.scaleSeekbar.y = scaleLabel.y + scaleLabel.height + seekBarHeight * 0.5;
            this.scaleSeekbar.onChenged.add(value => {
                radius = calcRadius(value);
                this.objects?.children?.forEach(e => {
                    e.scale(value);
                    e.modified();
                });
            });
            radius = calcRadius(this.scaleSeekbar.value);
            this.append(this.scaleSeekbar);

            const objectCountLabel = new g.Label({
                scene: this,
                text: "オブジェクト数",
                font: font,
                x: scaleLabel.x,
                y: this.scaleSeekbar.y + this.scaleSeekbar.height * 2,
            });
            this.append(objectCountLabel);

            this.objectCountSeekbar = new SeekBar(this, seekBarWidth, seekBarHeight);
            this.objectCountSeekbar.max = 32;
            this.objectCountSeekbar.min = 1;
            this.objectCountSeekbar.value = snapshot.objectCount ?? 1;
            this.objectCountSeekbar.x = objectCountLabel.x;
            this.objectCountSeekbar.y = objectCountLabel.y + objectCountLabel.height + seekBarHeight * 0.5;
            this.objectCountSeekbar.onTrackingEnd.add(value => {
                const count = Math.floor(value * MainScene.MIN_OBJECT_SIZE);
                if (count === objectCount) return;

                this.objects?.destroy();
                this.onUpdate.remove(updateHandler);

                objectCount = count;
                createObjects(objectCount, this.scaleSeekbar.value, this.opacitySeekbar.value);
                this.onUpdate.add(updateHandler);
            });
            objectCount = Math.floor(this.objectCountSeekbar.value * MainScene.MIN_OBJECT_SIZE);
            this.append(this.objectCountSeekbar);

            const opacityLabel = new g.Label({
                scene: this,
                text: "オブジェクト透過率",
                font: font,
                x: scaleLabel.x,
                y: this.objectCountSeekbar.y + this.objectCountSeekbar.height * 2,
            });
            this.append(opacityLabel);

            this.opacitySeekbar = new SeekBar(this, seekBarWidth, seekBarHeight);
            this.opacitySeekbar.min = 0.05;
            this.opacitySeekbar.value = snapshot.opacity ?? 1;
            this.opacitySeekbar.x = opacityLabel.x;
            this.opacitySeekbar.y = opacityLabel.y + opacityLabel.height + seekBarHeight * 0.5;
            this.opacitySeekbar.onChenged.add(value => {
                this.objects?.children?.forEach(e => {
                    e.opacity = value;
                    e.modified();
                });
            });
            this.append(this.opacitySeekbar);

            const bgOpacityLabel = new g.Label({
                scene: this,
                text: "背景透過率",
                font: font,
                x: scaleLabel.x,
                y: this.opacitySeekbar.y + this.opacitySeekbar.height * 2,
            });
            this.append(bgOpacityLabel);

            this.bgOopacitySeekbar = new SeekBar(this, seekBarWidth, seekBarHeight);
            this.bgOopacitySeekbar.value = snapshot.bgOpacity ?? bg.opacity;
            this.bgOopacitySeekbar.x = bgOpacityLabel.x;
            this.bgOopacitySeekbar.y = bgOpacityLabel.y + bgOpacityLabel.height + seekBarHeight * 0.5;
            this.bgOopacitySeekbar.onChenged.add(value => { bg.opacity = value; });
            this.append(this.bgOopacitySeekbar);

            createObjects(objectCount, this.scaleSeekbar.value, this.opacitySeekbar.value);
        });

        const createObjects = (objectCount: number, objectSize: number, objectOpacity: number) => {
            this.objects = new g.E({ scene: this });
            this.append(this.objects);

            for (let i = 0; i < objectCount; i++) {
                const entity = new Entity(this);
                entity.scale(objectSize);
                entity.opacity = objectOpacity;
                this.objects.append(entity);
            }
        };

        let t = 0;
        let objectCount: number;
        let radius: number;
        let speed: number;
        const PI2 = Math.PI * 2;
        const centerX = g.game.width / 2;
        const centerY = g.game.height / 2;

        const updateHandler = () => {
            t = Math.sin(g.game.age / (g.game.fps * (1000 / speed)));
            const length = this.objects?.children?.length ?? 0;
            this.objects?.children?.forEach((e, i) => {
                const r = Math.cos(PI2 * t * i);
                const x = Math.sin(i / length * PI2) * r * radius;
                const y = Math.cos(i / length * PI2) * r * radius;
                e.x = centerX + x;
                e.y = centerY + y;
                e.angle += (60 / g.game.fps) * 30;
                e.angle %= 360;
                const rate = Math.max(Math.abs(x), Math.abs(y)) / centerY;
                (e as Entity).cssColor = `${generateGradientColor(rate, t)}`;
                e.modified();
            });
        };

        this.onUpdate.add(_ => updateHandler());

        let frames = 0;
        let last = Date.now();
        this.onUpdate.add(_ => {
            frames++;
            const elapsed = Date.now() - last;
            if (frames >= g.game.fps && elapsed >= 1000) {
                const fps = (g.game.fps / elapsed) * 1000;
                this.fpsLabel.text = `FPS ${fps.toFixed(2)}`;
                this.fpsLabel.invalidate();
                frames = 0;
                last = Date.now();
            }
        });

        const calcRadius = (value: number): number => {
            const k = 100000;
            const log = Math.log(k * value + 1) / Math.log(k + 1)
            return ((g.game.height - MainScene.OBJECT_SIZE) / 2) * log;
        };

        const generateGradientColor = (value: number, t: number): string => {
            const time = t * PI2 * 4;
            const rRate = Math.sin(time);
            const gRate = Math.cos(time);
            const bRate = 1 - Math.sin(time);
            const base = 80;
            const offset = 175;
            const startColor: number[] = [base * rRate + offset, base * gRate + offset, base * bRate + offset];
            const endColor: number[] = [base * bRate + offset, base * gRate + offset, base * rRate + offset];
            const r = Math.round((1 - value) * startColor[0] + value * endColor[0]);
            const g = Math.round((1 - value) * startColor[1] + value * endColor[1]);
            const b = Math.round((1 - value) * startColor[2] + value * endColor[2]);
            return `rgb(${r},${g},${b})`;
        };
    }
}