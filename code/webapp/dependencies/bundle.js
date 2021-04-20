class Vector2D1 {
    x;
    y;
    constructor(x1 = 0, y1 = 0){
        this.x = x1;
        this.y = y1;
    }
    toJSON() {
        return [
            this.x,
            this.y
        ];
    }
    static revive(v) {
        return new Vector2D1(v[0], v[1]);
    }
    get fst() {
        return this.x;
    }
    get snd() {
        return this.y;
    }
    toString() {
        return `(${this.x}, ${this.y})`;
    }
    isEqual(v) {
        return this.x === v.x && this.y === v.y;
    }
    static isEqual(v1, v2) {
        return v1.x === v2.x && v1.y === v2.y;
    }
    static fromObj(obj) {
        return new Vector2D1(obj.x, obj.y);
    }
    static zero() {
        return new Vector2D1();
    }
    static pow7() {
        return new Vector2D1(127, 127);
    }
    static isBetween(a, b, c) {
        const epsilon = 0.1;
        const crossProduct = (c.y - a.y) * (b.x - a.x) - (c.x - a.x) * (b.y - a.y);
        if (Math.abs(crossProduct) > 0.1) {
            return false;
        }
        const dotProduct = (c.x - a.x) * (b.x - a.x) + (c.y - a.y) * (b.y - a.y);
        if (dotProduct < 0) {
            return false;
        }
        const squaredLengthBA = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
        if (dotProduct > squaredLengthBA) {
            return false;
        }
        return true;
    }
    static getNearSet(pt, _epsilon = 1) {
        const result = [];
        let epsilon = Math.abs(Math.round(_epsilon));
        const x1 = pt.x;
        const y1 = pt.y;
        while(epsilon > 0){
            const xA = x1 - epsilon;
            const xB = x1 + epsilon;
            const yA = y1 - epsilon;
            const yB = y1 + epsilon;
            result.push(new Vector2D1(xA, yA));
            result.push(new Vector2D1(x1, yA));
            result.push(new Vector2D1(xB, yA));
            result.push(new Vector2D1(xA, y1));
            result.push(new Vector2D1(xB, y1));
            result.push(new Vector2D1(xA, yB));
            result.push(new Vector2D1(x1, yB));
            result.push(new Vector2D1(xB, yB));
            epsilon = epsilon - 1;
        }
        return result;
    }
    static abs(p) {
        return new Vector2D1(Math.abs(p.x), Math.abs(p.y));
    }
    static createRounded(res, x, y) {
        const halfRes = res / 2;
        let result;
        if (x >= halfRes && y < halfRes) {
            result = new Vector2D1(Math.floor(x), Math.ceil(y));
        } else if (x < halfRes && y < halfRes) {
            result = new Vector2D1(Math.ceil(x), Math.ceil(y));
        } else if (x < halfRes && y >= halfRes) {
            result = new Vector2D1(Math.ceil(x), Math.floor(y));
        } else {
            result = new Vector2D1(Math.floor(x), Math.floor(y));
        }
        return result;
    }
    static insideTriangle(x, y, p0, p1, p2) {
        const area = 0.5 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
        const s = 1 / (2 * area) * (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * x + (p0.x - p2.x) * y);
        const t = 1 / (2 * area) * (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * x + (p1.x - p0.x) * y);
        return s >= -0.1 && t >= -0.1 && 1 - s - t >= 0;
    }
}
const mod = function() {
    return {
        Vector2D: Vector2D1
    };
}();
class Map2D {
    tree;
    _size;
    constructor(vectors, elements){
        this.tree = new Map();
        if (vectors && vectors.length > 0 && elements) {
            this._size = vectors.length;
            for(let i = 0; i < vectors.length; i++){
                const v = vectors[i];
                let vx, vy;
                if (v instanceof Array) {
                    vx = v[0];
                    vy = v[1];
                } else {
                    vx = v.x;
                    vy = v.y;
                }
                const ys = this.tree.get(vx) || new Map();
                ys.set(vy, elements[i]);
                this.tree.set(vx, ys);
            }
        } else {
            this._size = 0;
        }
    }
    toJSON(elemToJSON) {
        const result = [];
        this.map((elem, x2, y2)=>{
            if (x2 !== undefined && y2 !== undefined) {
                result.push([
                    x2,
                    y2,
                    elemToJSON(elem)
                ]);
            }
        });
        return result;
    }
    static revive(a, reviveElem) {
        const result = new Map2D();
        a.map((v)=>result.setXY(v[0], v[1], reviveElem(v[2]))
        );
        return result;
    }
    clear() {
        this.tree.clear();
        this._size = 0;
    }
    get size() {
        return this._size;
    }
    firstValue() {
        if (this._size === 0) {
            throw new Error("No values in this container");
        }
        return this.tree.values().next().value.values().next().value;
    }
    firstKey() {
        if (this.size === 0) {
            throw new Error("Trying to get the firstKey() but there are no keys in this container");
        }
        const [x2, ys] = this.tree.entries().next().value;
        return new Vector2D1(x2, ys.keys().next().value);
    }
    filter(f) {
        const result = new Map2D();
        for (const [x2, yMap] of this.tree.entries()){
            for (const [y2, val] of yMap.entries()){
                if (f(val, x2, y2)) {
                    result.setXY(x2, y2, val);
                }
            }
        }
        return result;
    }
    map(f) {
        const result = new Map2D();
        for (const [x2, yMap] of this.tree.entries()){
            for (const [y2, val] of yMap.entries()){
                result.setXY(x2, y2, f(val, x2, y2));
            }
        }
        return result;
    }
    *entries() {
        for (const [x2, yMap] of this.tree.entries()){
            for (const [y2, val] of yMap.entries()){
                yield [
                    [
                        x2,
                        y2
                    ],
                    val
                ];
            }
        }
    }
    *values() {
        for (const yMap of this.tree.values()){
            for (const value of yMap.values()){
                yield value;
            }
        }
    }
    *keys() {
        for (const [x2, yMap] of this.tree.entries()){
            for (const y2 of yMap.keys()){
                yield [
                    x2,
                    y2
                ];
            }
        }
    }
    setXY(x, y, value) {
        const ys = this.tree.get(x) || new Map();
        if (ys.size === 0 || !ys.has(y)) {
            this._size += 1;
        }
        ys.set(y, value);
        this.tree.set(x, ys);
        return this;
    }
    set(v, value) {
        return this.setXY(v.x, v.y, value);
    }
    deleteXY(x, y) {
        const ys = this.tree.get(x) || new Map();
        if (ys.size <= 1) {
            this.tree.delete(x);
        } else {
            ys.delete(y);
        }
        this._size -= 1;
        return this;
    }
    delete(v) {
        return this.deleteXY(v.x, v.y);
    }
    hasXY(x, y) {
        const map = this.tree.get(x);
        if (map) {
            return map.has(y);
        }
        return false;
    }
    has(v) {
        return this.hasXY(v.x, v.y);
    }
    get(v) {
        return this.getXY(v.x, v.y);
    }
    getXY(x, y) {
        return this.tree.get(x)?.get(y);
    }
    equals(set2) {
        if (this.size !== set2.size) {
            return false;
        }
        for (const [x2, yMap] of this.tree.entries()){
            for (const [y2, val] of yMap.entries()){
                const value = set2.getXY(x2, y2);
                if (!value || value !== val) {
                    return false;
                }
            }
        }
        return true;
    }
}
class Set2D {
    tree;
    get size() {
        return this.tree.size;
    }
    constructor(vectors1){
        if (vectors1) {
            this.tree = new Map2D(vectors1, vectors1);
            return;
        }
        this.tree = new Map2D();
    }
    toJSON() {
        return [
            ...this.keys()
        ];
    }
    static revive(a) {
        const result = new Set2D();
        a.map((v)=>result.addXY(v[0], v[1])
        );
        return result;
    }
    has(v) {
        return this.tree.has(v);
    }
    hasXY(x, y) {
        return this.tree.hasXY(x, y);
    }
    add(v) {
        this.tree.set(v, v);
        return this;
    }
    addXY(x, y) {
        this.tree.setXY(x, y, new Vector2D1(x, y));
        return this;
    }
    delete(v) {
        this.tree.delete(v);
        return this;
    }
    dup() {
        const result = new Set2D();
        return result.append(this);
    }
    append(set) {
        for (const [[x2, y2], v] of set.tree.entries()){
            this.tree.setXY(x2, y2, v);
        }
        return this;
    }
    *values() {
        for (const value of this.tree.values()){
            yield value;
        }
    }
    *keys() {
        for (const key of this.tree.keys()){
            yield key;
        }
    }
    *entries() {
        for (const entry of this.tree.entries()){
            yield entry;
        }
    }
    toArray() {
        return [
            ...this.tree.values()
        ];
    }
    first() {
        return this.tree.firstKey();
    }
    equals(set2) {
        if (this.tree.size !== set2.tree.size) {
            return false;
        }
        for (const v of this.tree.values()){
            if (!set2.has(v)) {
                return false;
            }
        }
        return true;
    }
    filter(f) {
        const result = new Set2D();
        for (const [[x2, y2], v] of this.tree.entries()){
            if (f(v, x2, y2)) {
                result.add(v);
            }
        }
        return result;
    }
    map(f) {
        const result = new Set2D();
        for (const [[x2, y2], v] of this.tree.entries()){
            result.add(f(v, x2, y2));
        }
        return result;
    }
}
const mod1 = function() {
    return {
        Map2D: Map2D,
        Set2D: Set2D
    };
}();
function transformPoint(m, v, dst) {
    dst = dst || [
        0,
        0,
        0
    ];
    const v0 = v[0];
    const v1 = v[1];
    const v2 = v[2];
    const d = v0 * m[0 * 4 + 3] + v1 * m[1 * 4 + 3] + v2 * m[2 * 4 + 3] + m[3 * 4 + 3];
    dst[0] = (v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0] + m[3 * 4 + 0]) / d;
    dst[1] = (v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1] + m[3 * 4 + 1]) / d;
    dst[2] = (v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2] + m[3 * 4 + 2]) / d;
    return dst;
}
function translation(v, dst) {
    dst = dst || new Float32Array(16);
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    dst[11] = 0;
    dst[12] = v[0];
    dst[13] = v[1];
    dst[14] = v[2];
    dst[15] = 1;
    return dst;
}
function identityMatrix() {
    const result = new Float32Array(16);
    result[0] = 1;
    result[5] = 1;
    result[10] = 1;
    result[15] = 1;
    return result;
}
function ortho({ left , right , bottom , top , near , far  }, dst) {
    dst = dst || new Float32Array(16);
    dst[0] = 2 / (right - left);
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 2 / (top - bottom);
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 2 / (near - far);
    dst[11] = 0;
    dst[12] = (right + left) / (left - right);
    dst[13] = (top + bottom) / (bottom - top);
    dst[14] = (far + near) / (near - far);
    dst[15] = 1;
    return dst;
}
function scale(m, v, dst) {
    dst = dst || new Float32Array(16);
    for(let i = 0; i < 4; i++){
        dst[0 + i] = v[0] * m[0 + i];
        dst[4 + i] = v[1] * m[4 + i];
        dst[8 + i] = v[2] * m[8 + i];
    }
    if (m !== dst) {
        dst[12] = m[12];
        dst[13] = m[13];
        dst[14] = m[14];
        dst[15] = m[15];
    }
    return dst;
}
function translate(m, v, dst) {
    dst = dst || new Float32Array(16);
    if (m !== dst) {
        for(let i = 0; i < 12; i++){
            dst[i] = m[i];
        }
    }
    for(let i = 0; i < 4; i++){
        dst[12 + i] = m[i] * v[0] + m[4 + i] * v[1] + m[8 + i] * v[2] + m[12 + i];
    }
    return dst;
}
function multiply(a, b, dst) {
    dst = dst || new Float32Array(16);
    const a00 = a[0];
    const a01 = a[1];
    const a02 = a[2];
    const a03 = a[3];
    const a10 = a[4 + 0];
    const a11 = a[4 + 1];
    const a12 = a[4 + 2];
    const a13 = a[4 + 3];
    const a20 = a[8 + 0];
    const a21 = a[8 + 1];
    const a22 = a[8 + 2];
    const a23 = a[8 + 3];
    const a30 = a[12 + 0];
    const a31 = a[12 + 1];
    const a32 = a[12 + 2];
    const a33 = a[12 + 3];
    const b00 = b[0];
    const b01 = b[1];
    const b02 = b[2];
    const b03 = b[3];
    const b10 = b[4 + 0];
    const b11 = b[4 + 1];
    const b12 = b[4 + 2];
    const b13 = b[4 + 3];
    const b20 = b[8 + 0];
    const b21 = b[8 + 1];
    const b22 = b[8 + 2];
    const b23 = b[8 + 3];
    const b30 = b[12 + 0];
    const b31 = b[12 + 1];
    const b32 = b[12 + 2];
    const b33 = b[12 + 3];
    dst[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
    dst[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
    dst[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
    dst[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
    dst[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
    dst[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
    dst[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
    dst[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
    dst[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
    dst[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
    dst[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
    dst[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
    dst[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
    dst[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
    dst[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
    dst[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
    return dst;
}
function inverse(m, dst) {
    dst = dst || new Float32Array(16);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    const tmp_0 = m22 * m33;
    const tmp_1 = m32 * m23;
    const tmp_2 = m12 * m33;
    const tmp_3 = m32 * m13;
    const tmp_4 = m12 * m23;
    const tmp_5 = m22 * m13;
    const tmp_6 = m02 * m33;
    const tmp_7 = m32 * m03;
    const tmp_8 = m02 * m23;
    const tmp_9 = m22 * m03;
    const tmp_10 = m02 * m13;
    const tmp_11 = m12 * m03;
    const tmp_12 = m20 * m31;
    const tmp_13 = m30 * m21;
    const tmp_14 = m10 * m31;
    const tmp_15 = m30 * m11;
    const tmp_16 = m10 * m21;
    const tmp_17 = m20 * m11;
    const tmp_18 = m00 * m31;
    const tmp_19 = m30 * m01;
    const tmp_20 = m00 * m21;
    const tmp_21 = m20 * m01;
    const tmp_22 = m00 * m11;
    const tmp_23 = m10 * m01;
    const t0 = tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31 - (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    const t1 = tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31 - (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    const t2 = tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31 - (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    const t3 = tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21 - (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);
    const d = 1 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
    dst[0] = d * t0;
    dst[1] = d * t1;
    dst[2] = d * t2;
    dst[3] = d * t3;
    dst[4] = d * (tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30 - (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
    dst[5] = d * (tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30 - (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
    dst[6] = d * (tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30 - (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
    dst[7] = d * (tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20 - (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
    dst[8] = d * (tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33 - (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
    dst[9] = d * (tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33 - (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
    dst[10] = d * (tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33 - (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
    dst[11] = d * (tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23 - (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
    dst[12] = d * (tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12 - (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
    dst[13] = d * (tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22 - (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
    dst[14] = d * (tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02 - (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
    dst[15] = d * (tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12 - (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));
    return dst;
}
const mod2 = function() {
    return {
        transformPoint: transformPoint,
        translation: translation,
        identityMatrix: identityMatrix,
        ortho: ortho,
        scale: scale,
        translate: translate,
        multiply: multiply,
        inverse: inverse
    };
}();
export { mod1 as Containers, mod2 as Matrix, mod as Vector2D };

