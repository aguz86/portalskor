// timerWorker.ts

let intervalId: any = null;

self.onmessage = (e) => {
    if (e.data === 'start') {
        if (!intervalId) {
            intervalId = setInterval(() => {
                self.postMessage('tick');
            }, 1000);
        }
    } else if (e.data === 'stop') {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }
};
