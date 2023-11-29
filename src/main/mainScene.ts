import { FontSize } from "./fontSize";
import { Entity } from "./entity";
import { SeekBar } from "./seekBar";

export class MainScene extends g.Scene {

    private static readonly MIN_OBJECT_SIZE = 32;
    private static readonly OBJECT_SIZE = 8 * 4;

    private objects: g.E;

    constructor() {
        super({ game: g.game });

        this.onLoad.add(_scene => {
            const bg = new g.FilledRect({
                scene: _scene,
                width: g.game.width,
                height: g.game.height,
                cssColor: "black",
                opacity: 0,
            });
            this.append(bg);

            const font = new g.DynamicFont({
                game: g.game,
                fontFamily: "sans-serif",
                fontWeight: "bold",
                strokeWidth: FontSize.TINY / 4,
                strokeColor: "black",
                fontColor: "white",
                size: FontSize.TINY,
            });

            const versionLabel = new g.Label({
                scene: this,
                text: `Version ${g.game.vars.version}`,
                font: font,
                fontSize: 12,
            });
            versionLabel.x = g.game.width - versionLabel.width;
            versionLabel.y = g.game.height - versionLabel.height;
            this.append(versionLabel);

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

            const speedSeekbar = new SeekBar(this, seekBarWidth, seekBarHeight);
            speedSeekbar.min = 1;
            speedSeekbar.max = 100;
            speedSeekbar.value = 1;
            speedSeekbar.x = speedLabel.x;
            speedSeekbar.y = speedLabel.y + speedLabel.height + seekBarHeight * 0.5;
            speedSeekbar.onChenged.add(value => { speed = value; });
            speed = speedSeekbar.value;
            this.append(speedSeekbar);

            const sizeLabel = new g.Label({
                scene: this,
                text: "大きさ",
                font: font,
                x: g.game.width - seekBarWidth * 1.5,
                y: speedSeekbar.y + speedSeekbar.height * 2,
            });
            this.append(sizeLabel);

            const sizeSeekbar = new SeekBar(this, seekBarWidth, seekBarHeight);
            sizeSeekbar.max = 2;
            sizeSeekbar.min = 0.05;
            sizeSeekbar.value = .5;
            sizeSeekbar.x = sizeLabel.x;
            sizeSeekbar.y = sizeLabel.y + sizeLabel.height + seekBarHeight * 0.5;
            sizeSeekbar.onChenged.add(value => {
                radius = calcRadius(value);
                this.objects.children.forEach(e => {
                    e.scale(value);
                    e.modified();
                });
            });
            radius = calcRadius(sizeSeekbar.value);
            this.append(sizeSeekbar);

            const objectCountLabel = new g.Label({
                scene: this,
                text: "オブジェクト数",
                font: font,
                x: sizeLabel.x,
                y: sizeSeekbar.y + sizeSeekbar.height * 2,
            });
            this.append(objectCountLabel);

            const objectCountSeekbar = new SeekBar(this, seekBarWidth, seekBarHeight);
            objectCountSeekbar.max = 32;
            objectCountSeekbar.min = 1;
            objectCountSeekbar.value = 1;
            objectCountSeekbar.x = objectCountLabel.x;
            objectCountSeekbar.y = objectCountLabel.y + objectCountLabel.height + seekBarHeight * 0.5;
            objectCountSeekbar.onTrackingEnd.add(value => {
                const count = Math.floor(value * MainScene.MIN_OBJECT_SIZE);
                if (count === objectCount) return;

                if (this.objects) {
                    this.objects.destroy();
                }
                this.onUpdate.remove(updateHandler);

                objectCount = count;
                createObjects(objectCount, sizeSeekbar.value, opacitySeekbar.value);
                this.onUpdate.add(updateHandler);
            });
            objectCount = Math.floor(objectCountSeekbar.value * MainScene.MIN_OBJECT_SIZE);
            this.append(objectCountSeekbar);

            const opacityLabel = new g.Label({
                scene: this,
                text: "オブジェクト透過率",
                font: font,
                x: sizeLabel.x,
                y: objectCountSeekbar.y + objectCountSeekbar.height * 2,
            });
            this.append(opacityLabel);

            const opacitySeekbar = new SeekBar(this, seekBarWidth, seekBarHeight);
            opacitySeekbar.min = 0.05;
            opacitySeekbar.value = 0.5;
            opacitySeekbar.x = opacityLabel.x;
            opacitySeekbar.y = opacityLabel.y + opacityLabel.height + seekBarHeight * 0.5;
            opacitySeekbar.onChenged.add(value => {
                this.objects.children.forEach(e => {
                    e.opacity = value;
                    e.modified();
                });
            });
            this.append(opacitySeekbar);

            const bgOpacityLabel = new g.Label({
                scene: this,
                text: "背景透過率",
                font: font,
                x: sizeLabel.x,
                y: opacitySeekbar.y + opacitySeekbar.height * 2,
            });
            this.append(bgOpacityLabel);

            const bgOopacitySeekbar = new SeekBar(this, seekBarWidth, seekBarHeight);
            bgOopacitySeekbar.value = bg.opacity;
            bgOopacitySeekbar.x = bgOpacityLabel.x;
            bgOopacitySeekbar.y = bgOpacityLabel.y + bgOpacityLabel.height + seekBarHeight * 0.5;
            bgOopacitySeekbar.onChenged.add(value => { bg.opacity = value; });
            this.append(bgOopacitySeekbar);

            createObjects(objectCount, sizeSeekbar.value, opacitySeekbar.value);
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
            const length = this.objects.children.length;
            this.objects.children.forEach((e, i) => {
                const r = Math.cos(PI2 * t * i);
                const x = Math.sin(i / length * PI2) * r * radius;
                const y = Math.cos(i / length * PI2) * r * radius;
                e.x = centerX + x;
                e.y = centerY + y;
                e.angle += (60 / g.game.fps) * 30;
                if (e.angle >= 360) {
                    e.angle = 0;
                }
                const rate = Math.max(Math.abs(x), Math.abs(y)) / centerY;
                (e as Entity).cssColor = `${generateGradientColor(rate, t)}`;
                e.modified();
            });
        };

        this.onUpdate.add(_ => updateHandler());

        const calcRadius = (value: number): number => {
            const k = 100000;
            const log = Math.log(k * value + 1) / Math.log(k + 1)
            return ((g.game.height - MainScene.OBJECT_SIZE) / 2) * log;
        };

        const generateGradientColor = (value: number, t: number): string => {
            const time = t * PI2 * 2;
            const rRate = Math.sin(time);
            const gRate = Math.cos(time);
            const bRate = 1 - Math.sin(time);
            const base = 64;
            const offset = 191;
            const startColor: number[] = [base * rRate + offset, base * gRate + offset, base * bRate + offset];
            const endColor: number[] = [base * bRate + offset, base * gRate + offset, base * rRate + offset];
            const r = Math.round((1 - value) * startColor[0] + value * endColor[0]);
            const g = Math.round((1 - value) * startColor[1] + value * endColor[1]);
            const b = Math.round((1 - value) * startColor[2] + value * endColor[2]);
            return `rgb(${r},${g},${b})`;
        };
    }
}