(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /*
    sources from https://github.com/davidmarkclements/hsl-to-hex
    and https://www.npmjs.com/package/hsl-to-rgb-for-reals
    but I needed to tweak some code mainly the # 0x thing and be fast
    */
    function max(val, n) {
        return (val > n) ? n : val;
    }
    function min(val, n) {
        return (val < n) ? n : val;
    }
    function cycle(val) {
        // for safety:
        val = max(val, 1e7);
        val = min(val, -1e7);
        // cycle value:
        while (val < 0) {
            val += 360;
        }
        while (val > 359) {
            val -= 360;
        }
        return val;
    }
    var toRgb = function (hue, saturation, lightness) {
        // based on algorithm from http://en.wikipedia.org/wiki/HSL_and_HSV#Converting_to_RGB
        if (hue == undefined) {
            return [0, 0, 0];
        }
        var chroma = (1 - Math.abs((2 * lightness) - 1)) * saturation;
        var huePrime = hue / 60;
        var secondComponent = chroma * (1 - Math.abs((huePrime % 2) - 1));
        huePrime = Math.floor(huePrime);
        var red;
        var green;
        var blue;
        if (huePrime === 0) {
            red = chroma;
            green = secondComponent;
            blue = 0;
        }
        else if (huePrime === 1) {
            red = secondComponent;
            green = chroma;
            blue = 0;
        }
        else if (huePrime === 2) {
            red = 0;
            green = chroma;
            blue = secondComponent;
        }
        else if (huePrime === 3) {
            red = 0;
            green = secondComponent;
            blue = chroma;
        }
        else if (huePrime === 4) {
            red = secondComponent;
            green = 0;
            blue = chroma;
        }
        else if (huePrime === 5) {
            red = chroma;
            green = 0;
            blue = secondComponent;
        }
        var lightnessAdjustment = lightness - (chroma / 2);
        red += lightnessAdjustment;
        green += lightnessAdjustment;
        blue += lightnessAdjustment;
        return [Math.round(red * 255), Math.round(green * 255), Math.round(blue * 255)];
    };
    // Now for the main piece, the `hsl` function:
    function hsl(hue, saturation, luminosity) {
        // resolve degrees to 0 - 359 range
        hue = cycle(hue);
        // enforce constraints
        saturation = min(max(saturation, 100), 0);
        luminosity = min(max(luminosity, 100), 0);
        // convert to 0 to 1 range used by hsl-to-rgb-for-reals
        saturation /= 100;
        luminosity /= 100;
        // let hsl-to-rgb-for-reals do the hard work
        var rgb = toRgb(hue, saturation, luminosity);
        // convert each value in the returned RGB array
        // to a 2 character hex value, join the array into
        // a string, prefixed with a hash
        return '0x' + rgb
            .map(function (n) {
            return (256 + n).toString(16).substr(-2);
        })
            .join('');
    }
    exports.hsl = hsl;
});
//# sourceMappingURL=hsl2rgb.js.map