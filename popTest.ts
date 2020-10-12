import { tween, styler, Action, easing, action, listen, pointer, ColdSubscription } from 'popmotion';
import { SVG } from '@svgdotjs/svg.js'

function popTest($elment: Element) {
    const draw = SVG().addTo($elment as HTMLElement).size(500, 500)
    const rect = draw.rect(100, 100).attr({ fill: '#f06' }).addClass('ball')
    const circle = draw.circle(50, 50).attr({ fill: '#55f' }).addClass('ball')

    const movingRect = styler(rect.node);
    const movingCircle = styler(circle.node);

    const just = (v: number) => action(({ update, complete }) => {
        for (const el of Array(v).keys()) {
            update(el);
        }
        complete();
    });
    just(10)
        .filter((v: number) => v > 5)
        .while((v: number) => v < 7)
        .start({
            update: (v: number) => console.log('updated ' + v),
            complete: () => console.log('completed')
        })


    //Tracker
    let pointerTracker: ColdSubscription;

    listen(circle.node, 'mousedown touchstart').start(() => {
        pointerTracker = pointer({
            x: movingCircle.get('x'),
            y: movingCircle.get('y')
        })
            .start(({ x, y }: { x: number; y: number }) => {
                console.log(x, y)
                movingCircle.set({ x, y })
            });
    });

    listen(document, 'mouseup touchend').start(() => {
        if (pointerTracker) pointerTracker.stop();
    });

    //Movigng animation
    return () => {
        tween({
            from: { x: 0, scale: 1 },
            to: { x: 300, scale: 2 },
            ease: easing.easeInOut,
            flip: Infinity,
            duration: 1000
        }).start((v: any) => movingRect.set(v));
    }

}

export default popTest