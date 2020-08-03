// 默认的实例配置
let defaultInstanceSettings = {
    update: null,
    begin: null,
    loopBegin: null,
    changeBegin: null,
    change: null,
    changeComplete: null,
    loopComplete: null,
    complete: null,
    loop: 1,
    direction: 'normal',
    autoplay: true,
    timelineOffset: 0
}

// 默认的动画配置
let defaultTweenSettings = {
    duration: 1000,
    delay: 0,
    endDelay: 0,
    easing: 'easeOutElastic(1, .5)',
    round: 0
}


// 根据传入的参数更新默认配置
function replaceObjectProps(o1, o2) {
    let o = cloneObject(o1);
    for (let p in o1) {
        o[p] = o2.hasOwnProperty(p) ? o2[p] : o1[p];
    }
    return o;
}

// 浅复制对象, 未使用hasOwnProperty检查
function cloneObject(obj) {
    let clone = {};
    for (let p in obj) {
        clone[p] = obj[p];
    }
    return clone;
}

// 合并两个对象
// 本质上是将O2中属性转移到O1身上
function mergeObjects(o1, o2) {
    let o = cloneObject(o1);
    for (let p in o2) {
        o[p] = is.und(o1[p]) ? o2[p] : o1[p];
    }
    return o;
}

/*
* 将keyframes数据格式化
* [
    {translateY: -40},
    {translateX: 250},
    {translateY: 40},
    {translateX: 0},
    {translateY: 0}
 ]
转换为：
{
   translateY: [{value: -40, value: 250} .... ]
}
*  */
function flattenKeyframes(keyframes) {
    // 拿到所有的keyframes的键的部分
    var propertyNames = filterArray(flattenArray(keyframes.map(function (key) { return Object.keys(key); })), function (p) { return is.key(p); })
    // reduce去重
    .reduce(function (a,b) { if (a.indexOf(b) < 0) { a.push(b); } return a; }, []);

    let properties = {};
    let loop = function (i) {
        let propName = propertyNames[i];
        properties[propName] = keyframes.map(function (key) {
            var newKey = {};
            for (var p in key) {
                if (is.key(p)) {
                    if (p == propName) { newKey.value = key[p]; }
                } else {
                    newKey[p] = key[p];
                }
            }
            return newKey;
        });
    }
    for (var i = 0; i < propertyNames.length; i++) loop( i );
    return properties;
}

// 根据callback函数对数据进行过滤
function filterArray(arr, callback) {
    let len = arr.length;
    // callback可能为undefined
    let thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    let result = [];
    for (let i = 0; i < len; i++) {
        if (i in arr) { // 不明所以的判断
            let val = arr[i];
            if (callback.call(thisArg, val, i, arr)) {
                result.push(val);
            }
        }
    }
    return result;
}
// 一维化数组
function flattenArray(arr) {
    return arr.reduce((a, b) => { return a.concat(is.arr(b) ? filterArray(b) : b)}, []);
}

// 创建新的动画实例
function createNewInstance(params) {
    // 获取根据参数更新后的实例配置
    let instanceSettings = replaceObjectProps(defaultInstanceSettings, params);
    // 获取根据参数更新后的tween配置
    let tweenSettings = replaceObjectProps(defaultTweenSettings, params);


}


function getProperties(tweenSettings, params) {
    let properties = [];
    /*
    * 对keyframes进行处理
    * keyframes型如：
    *  [
    *    {value: 100, easing: 'easeOutExpo'},
    *    {value: 200, delay: 500},
    *    {value : 300, duration: 1000}
    *  ]
    * /
       [
        {translateY: -40},
        {translateX: 250},
        {translateY: 40},
        {translateX: 0},
        {translateY: 0}
       ]
    * */
    let keyframes = params.keyframes;
    if (keyframes) {
        // 如果有keyframes，直接一维化，并且和原本的参数合为一个
        params = mergeObjects(flattenKeyframes(keyframes), params);
    }
    for (let p in params) {
        if (is.key(p)) {
            properties.push({
                name: p,
                tweens: 0
            })
        }
    }
}
function normalizePropertyTweens(prop, tweenSettings) {
    var settings = cloneObject(tweenSettings);
    // Override duration if easing is a spring
    if (/^spring/.test(settings.easing)) { settings.duration = spring(settings.easing); }
    if (is.arr(prop)) {
        var l = prop.length;
        var isFromTo = (l === 2 && !is.obj(prop[0]));
        if (!isFromTo) {
            // Duration divided by the number of tweens
            if (!is.fnc(tweenSettings.duration)) { settings.duration = tweenSettings.duration / l; }
        } else {
            // Transform [from, to] values shorthand to a valid tween value
            prop = {value: prop};
        }
    }
    var propArray = is.arr(prop) ? prop : [prop];
    return propArray.map(function (v, i) {
        var obj = (is.obj(v) && !is.pth(v)) ? v : {value: v};
        // Default delay value should only be applied to the first tween
        if (is.und(obj.delay)) { obj.delay = !i ? tweenSettings.delay : 0; }
        // Default endDelay value should only be applied to the last tween
        if (is.und(obj.endDelay)) { obj.endDelay = i === propArray.length - 1 ? tweenSettings.endDelay : 0; }
        return obj;
    }).map(function (k) { return mergeObjects(k, settings); });
}


function anime(params) {
    let instance = createNewInstance(params);
}



var is = {
    arr: function (a) { return Array.isArray(a); },
    obj: function (a) { return stringContains(Object.prototype.toString.call(a), 'Object'); },
    pth: function (a) { return is.obj(a) && a.hasOwnProperty('totalLength'); },
    svg: function (a) { return a instanceof SVGElement; },
    inp: function (a) { return a instanceof HTMLInputElement; },
    dom: function (a) { return a.nodeType || is.svg(a); },
    str: function (a) { return typeof a === 'string'; },
    fnc: function (a) { return typeof a === 'function'; },
    und: function (a) { return typeof a === 'undefined'; },
    hex: function (a) { return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(a); },
    rgb: function (a) { return /^rgb/.test(a); },
    hsl: function (a) { return /^hsl/.test(a); },
    col: function (a) { return (is.hex(a) || is.rgb(a) || is.hsl(a)); },
    key: function (a) { return !defaultInstanceSettings.hasOwnProperty(a) && !defaultTweenSettings.hasOwnProperty(a) && a !== 'targets' && a !== 'keyframes'; }
};



