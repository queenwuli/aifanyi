window.open = window.aiApi.open;
window.originAlert = window.alert;
window.alert = (msg) => {
    if (!msg) return;
    if (msg.includes("band.us")) {
        console.log(msg)
    } else {
        originAlert(msg);
    }
};