//v.1.0 - recursive

function jsonkc(json, keys) {
    try {
        if(keys.length === 0) return true;
        let key = keys.shift();
        if (json[key] === undefined) return false;
        return jsonkc(json[key], keys);
    } catch (error) {
        return false;
    }
}
module.exports = {
    jsonkc
};
