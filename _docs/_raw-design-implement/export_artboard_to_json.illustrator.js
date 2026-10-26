/**
 * 【Adobe Illustrator 専用】
 * アクティブアートボードを「コーディング補助用の薄い JSON」に書き出す
 * （@raw-design-implement 用）
 *
 * ファイル名: export_artboard_to_json.illustrator.js
 * Photoshop 用は同フォルダの export_artboard_to_json.photoshop.js
 *
 * ## 入れるもの / 入れないもの
 *
 * | typename           | 出力 | 主な値 |
 * |--------------------|------|--------|
 * | GroupItem          | ○（子が空の無名グループは除外） | name, bounds, children |
 * | TextFrame          | ○ | name, bounds, contents, textStyle（font/size/fill 等） |
 * | RasterItem         | ○ | name, bounds |
 * | PlacedItem         | ○ | name, bounds, file（取れるとき） |
 * | PathItem           | 名前付きのみ | name, bounds, fill, stroke（points は出さない） |
 * | CompoundPathItem   | 名前付きのみ | name, bounds, fill, stroke（子パス展開しない） |
 * | その他             | × | — |
 *
 * 共通:
 * - 非表示・アートボード外は除外
 * - bounds はアートボード左上原点・Y下向き正の { x, y, width, height }
 * - visible は必ず true/false（undefined 禁止）
 * - パスの点列・グラデ詳細・効果は出さない（サイズ肥大・CSS化しにくいため）
 *
 * 使い方: イラレで対象アートボードをアクティブ → ファイル > スクリプト > その他
 */
(function () {
    if (app.documents.length === 0) {
        alert("ドキュメントが開かれていません。");
        return;
    }

    // --- JSON.stringify（ExtendScript 向け・undefined/制御文字対応） ---
    function escapeString(str) {
        return String(str)
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"')
            .replace(/\r/g, "\\r")
            .replace(/\n/g, "\\n")
            .replace(/\t/g, "\\t")
            .replace(/[\x00-\x1f]/g, function (ch) {
                var hex = ch.charCodeAt(0).toString(16);
                return "\\u" + ("0000" + hex).slice(-4);
            });
    }

    function jsonStringify(obj) {
        if (obj === null) return "null";
        var t = typeof obj;
        if (t === "string") return '"' + escapeString(obj) + '"';
        if (t === "number") return isFinite(obj) ? String(obj) : "null";
        if (t === "boolean") return obj ? "true" : "false";
        if (t === "undefined") return "null";
        if (t !== "object") return "null";

        var i, k, v, parts, isArr;
        isArr = obj instanceof Array;
        parts = [];
        if (isArr) {
            for (i = 0; i < obj.length; i++) {
                v = obj[i];
                if (typeof v === "undefined") {
                    parts.push("null");
                } else {
                    parts.push(jsonStringify(v));
                }
            }
            return "[" + parts.join(",") + "]";
        }
        for (k in obj) {
            if (!obj.hasOwnProperty(k)) continue;
            v = obj[k];
            if (typeof v === "undefined") continue; // キーごと省略
            parts.push('"' + escapeString(k) + '":' + jsonStringify(v));
        }
        return "{" + parts.join(",") + "}";
    }

    var doc = app.activeDocument;
    var artboardIndex = doc.artboards.getActiveArtboardIndex();
    var targetArtboard = doc.artboards[artboardIndex];
    var abRect = targetArtboard.artboardRect; // [left, top, right, bottom]

    function round2(n) {
        return Math.round(n * 100) / 100;
    }

    function isInsideArtboard(elementBounds, abBounds) {
        var eL = elementBounds[0],
            eT = elementBounds[1],
            eR = elementBounds[2],
            eB = elementBounds[3];
        var aL = abBounds[0],
            aT = abBounds[1],
            aR = abBounds[2],
            aB = abBounds[3];
        if (eR < aL || eL > aR || eB > aT || eT < aB) return false;
        return true;
    }

    /** geometricBounds [L,T,R,B] → アートボード相対の箱 */
    function boundsFromGeometric(gb) {
        return {
            x: round2(gb[0] - abRect[0]),
            y: round2(abRect[1] - gb[1]),
            width: round2(gb[2] - gb[0]),
            height: round2(gb[1] - gb[3])
        };
    }

    function itemName(item) {
        try {
            return item.name || "";
        } catch (e) {
            return "";
        }
    }

    function isNamed(item) {
        var n = itemName(item);
        return n !== "" && n !== "<Path>";
    }

    function displayName(item) {
        var n = itemName(item);
        return n === "" ? "Unnamed" : n;
    }

    function colorToObject(color) {
        if (!color) return null;
        var t;
        try {
            t = color.typename;
        } catch (e) {
            return null;
        }
        try {
            if (t === "RGBColor") {
                return {
                    space: "rgb",
                    r: round2(color.red),
                    g: round2(color.green),
                    b: round2(color.blue)
                };
            }
            if (t === "CMYKColor") {
                return {
                    space: "cmyk",
                    c: round2(color.cyan),
                    m: round2(color.magenta),
                    y: round2(color.yellow),
                    k: round2(color.black)
                };
            }
            if (t === "GrayColor") {
                var g = round2(255 - color.gray * 2.55);
                return { space: "rgb", r: g, g: g, b: g };
            }
            if (t === "SpotColor") {
                return colorToObject(color.spot.color);
            }
            if (t === "GradientColor") {
                return { space: "gradient" };
            }
            if (t === "NoColor") {
                return null;
            }
        } catch (e2) {
            return { space: "unknown", typename: t };
        }
        return { space: "unknown", typename: t };
    }

    function getFillStroke(item) {
        var out = {};
        try {
            if (item.filled) out.fill = colorToObject(item.fillColor);
        } catch (e) {}
        try {
            if (item.stroked) {
                out.stroke = colorToObject(item.strokeColor);
                try {
                    out.strokeWidth = round2(item.strokeWidth);
                } catch (e2) {}
            }
        } catch (e3) {}
        return out;
    }

    function getTextStyle(tf) {
        var style = {};
        try {
            var attr = tf.textRange.characterAttributes;
            try {
                style.font = attr.textFont.name;
            } catch (e) {}
            try {
                style.size = round2(attr.size);
            } catch (e2) {}
            try {
                style.fill = colorToObject(attr.fillColor);
            } catch (e3) {}
            try {
                style.tracking = round2(attr.tracking);
            } catch (e4) {}
            try {
                // auto leading のときは値が大きい／特殊なことがあるので参考値
                style.leading = round2(attr.leading);
            } catch (e5) {}
        } catch (e6) {
            return null;
        }
        return style;
    }

    function shouldConsiderType(typename) {
        return (
            typename === "GroupItem" ||
            typename === "TextFrame" ||
            typename === "RasterItem" ||
            typename === "PlacedItem" ||
            typename === "PathItem" ||
            typename === "CompoundPathItem"
        );
    }

    function parseItem(item) {
        var typename;
        try {
            if (item.hidden) return null;
            typename = item.typename;
        } catch (e) {
            return null;
        }

        if (!shouldConsiderType(typename)) return null;

        // 無名パスはノイズなので出さない
        if (
            (typename === "PathItem" || typename === "CompoundPathItem") &&
            !isNamed(item)
        ) {
            return null;
        }

        var gb;
        try {
            gb = item.geometricBounds;
        } catch (e2) {
            return null;
        }
        if (!isInsideArtboard(gb, abRect)) return null;

        var data = {
            name: displayName(item),
            typename: typename,
            visible: item.visible === true,
            bounds: boundsFromGeometric(gb)
        };

        if (typename === "GroupItem") {
            data.children = [];
            var g, child;
            for (g = 0; g < item.pageItems.length; g++) {
                child = parseItem(item.pageItems[g]);
                if (child) data.children.push(child);
            }
            // 子が無く無名なら階層ノイズとして落とす
            if (data.children.length === 0 && !isNamed(item)) return null;
            return data;
        }

        if (typename === "TextFrame") {
            try {
                data.contents = String(item.contents);
            } catch (e3) {
                data.contents = "";
            }
            data.textStyle = getTextStyle(item);
            return data;
        }

        if (typename === "PlacedItem") {
            try {
                if (item.file) data.file = File.decode(item.file.name);
            } catch (e4) {}
            return data;
        }

        if (typename === "RasterItem") {
            return data;
        }

        // PathItem / CompoundPathItem（名前付きのみ）
        var fs = getFillStroke(item);
        if (fs.fill) data.fill = fs.fill;
        if (fs.stroke) data.stroke = fs.stroke;
        if (fs.strokeWidth !== undefined) data.strokeWidth = fs.strokeWidth;
        return data;
    }

    function parseLayers(layers) {
        var result = [];
        var i, j, layer, layerData, itemData;
        for (i = 0; i < layers.length; i++) {
            layer = layers[i];
            if (layer.visible === false) continue;

            layerData = {
                layerName: layer.name,
                items: [],
                subLayers: parseLayers(layer.layers)
            };

            for (j = 0; j < layer.pageItems.length; j++) {
                if (layer.pageItems[j].parent === layer) {
                    itemData = parseItem(layer.pageItems[j]);
                    if (itemData) layerData.items.push(itemData);
                }
            }

            if (layerData.items.length > 0 || layerData.subLayers.length > 0) {
                result.push(layerData);
            }
        }
        return result;
    }

    var resultData = {
        meta: {
            purpose: "coding-assist",
            coordinate: "artboard-top-left, y-down",
            note: "Unnamed Path/CompoundPath omitted. Path points omitted."
        },
        artboard: {
            name: targetArtboard.name,
            index: artboardIndex,
            width: round2(abRect[2] - abRect[0]),
            height: round2(abRect[1] - abRect[3])
        },
        layers: parseLayers(doc.layers)
    };

    var jsonString = jsonStringify(resultData);
    var saveFile = File.saveDialog("JSONファイルを保存", "*.json");
    if (saveFile) {
        saveFile.open("w");
        saveFile.encoding = "UTF-8";
        saveFile.write(jsonString);
        saveFile.close();
        alert(
            "アートボード「" +
                targetArtboard.name +
                "」をコーディング用 JSON に出力しました。"
        );
    }
})();
