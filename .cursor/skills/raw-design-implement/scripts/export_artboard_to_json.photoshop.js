/**
 * 【Adobe Photoshop 専用】
 * 対象アートボード（またはドキュメント全体）を「コーディング補助用の薄い JSON」に書き出す
 * （@raw-design-implement 用）
 *
 * ファイル名: export_artboard_to_json.photoshop.js
 * Illustrator 用は同フォルダの export_artboard_to_json.illustrator.js
 *
 * ## 入れるもの / 入れないもの（スキル互換の typename）
 *
 * | 実体                | typename     | 出力 |
 * |---------------------|--------------|------|
 * | レイヤーセット      | GroupItem    | ○（子が空の無名は除外） |
 * | テキストレイヤー    | TextFrame    | ○ contents / textStyle / bounds |
 * | ピクセル・スマートオブジェクト等 | RasterItem | ○ bounds |
 * | その他（調整レイヤー等） | —         | × |
 *
 * 共通:
 * - 非表示・対象ボード外は除外
 * - bounds はアートボード左上原点・Y下向き正の { x, y, width, height }
 * - ラスタライズ済み文字は TextFrame にならない（取れない）
 *
 * 使い方: Photoshop で対象ドキュメントを開く → ファイル > スクリプト > 参照
 * アートボードが複数あるときはダイアログで選択
 */
#target photoshop
app.displayDialogs = DialogModes.NO;

(function () {
    if (!app.documents.length) {
        alert("ドキュメントが開かれていません。");
        return;
    }

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
                parts.push(typeof v === "undefined" ? "null" : jsonStringify(v));
            }
            return "[" + parts.join(",") + "]";
        }
        for (k in obj) {
            if (!obj.hasOwnProperty(k)) continue;
            v = obj[k];
            if (typeof v === "undefined") continue;
            parts.push('"' + escapeString(k) + '":' + jsonStringify(v));
        }
        return "{" + parts.join(",") + "}";
    }

    function round2(n) {
        return Math.round(Number(n) * 100) / 100;
    }

    function unitToPx(u) {
        try {
            return u.as("px");
        } catch (e) {
            return Number(u);
        }
    }

    /** Action Manager でアートボード一覧を取得 */
    function listArtboards() {
        var out = [];
        try {
            var ref = new ActionReference();
            ref.putProperty(charIDToTypeID("Prpr"), stringIDToTypeID("artboards"));
            ref.putEnumerated(charIDToTypeID("Dcmn"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
            var desc = executeActionGet(ref);
            if (!desc.hasKey(stringIDToTypeID("artboards"))) return out;
            var list = desc.getList(stringIDToTypeID("artboards"));
            var i, abDesc, rect, name;
            for (i = 0; i < list.count; i++) {
                abDesc = list.getObjectValue(i);
                name = abDesc.hasKey(stringIDToTypeID("name"))
                    ? abDesc.getString(stringIDToTypeID("name"))
                    : "Artboard " + (i + 1);
                rect = abDesc.getObjectValue(stringIDToTypeID("artboardRect"));
                out.push({
                    name: name,
                    index: i,
                    left: rect.getDouble(stringIDToTypeID("left")),
                    top: rect.getDouble(stringIDToTypeID("top")),
                    right: rect.getDouble(stringIDToTypeID("right")),
                    bottom: rect.getDouble(stringIDToTypeID("bottom"))
                });
            }
        } catch (e) {}
        return out;
    }

    function pickArtboard(artboards) {
        if (!artboards.length) {
            var doc = app.activeDocument;
            return {
                name: doc.name,
                index: 0,
                left: 0,
                top: 0,
                right: unitToPx(doc.width),
                bottom: unitToPx(doc.height)
            };
        }
        if (artboards.length === 1) return artboards[0];

        var labels = [];
        var i;
        for (i = 0; i < artboards.length; i++) {
            labels.push(i + 1 + ": " + artboards[i].name);
        }
        var w = new Window("dialog", "アートボードを選択");
        w.orientation = "column";
        w.alignChildren = "fill";
        w.add("statictext", undefined, "書き出すアートボード:");
        var list = w.add("listbox", undefined, labels);
        list.preferredSize = [320, 160];
        list.selection = 0;
        var btns = w.add("group");
        btns.alignment = "right";
        var ok = btns.add("button", undefined, "OK", { name: "ok" });
        btns.add("button", undefined, "キャンセル", { name: "cancel" });
        ok.onClick = function () {
            w.close(1);
        };
        if (w.show() !== 1 || !list.selection) return null;
        return artboards[list.selection.index];
    }

    var doc = app.activeDocument;
    var artboards = listArtboards();
    var ab = pickArtboard(artboards);
    if (!ab) return;

    var abRect = [ab.left, ab.top, ab.right, ab.bottom];

    function isInsideArtboard(b) {
        // b: {L,T,R,B} document px
        if (b.R < abRect[0] || b.L > abRect[2] || b.B < abRect[1] || b.T > abRect[3]) {
            return false;
        }
        return true;
    }

    function boundsFromDoc(b) {
        return {
            x: round2(b.L - abRect[0]),
            y: round2(b.T - abRect[1]),
            width: round2(b.R - b.L),
            height: round2(b.B - b.T)
        };
    }

    function layerBoundsPx(layer) {
        try {
            var bb = layer.bounds;
            return {
                L: unitToPx(bb[0]),
                T: unitToPx(bb[1]),
                R: unitToPx(bb[2]),
                B: unitToPx(bb[3])
            };
        } catch (e) {
            return null;
        }
    }

    function isNamed(name) {
        return name && name !== "" && name !== "レイヤー 1" && name.indexOf("レイヤー ") !== 0;
    }
    // 無名判定はゆるく: 空のみ Unnamed。日本語デフォルト名も出力はする

    function displayName(name) {
        return name && name !== "" ? name : "Unnamed";
    }

    function solidColorToObject(sc) {
        if (!sc) return null;
        try {
            var rgb = sc.rgb;
            return {
                space: "rgb",
                r: round2(rgb.red),
                g: round2(rgb.green),
                b: round2(rgb.blue)
            };
        } catch (e) {
            return null;
        }
    }

    function getTextStyle(artLayer) {
        var style = {};
        try {
            var ti = artLayer.textItem;
            try {
                style.font = String(ti.font);
            } catch (e) {}
            try {
                style.size = round2(ti.size.as("px"));
            } catch (e2) {
                try {
                    style.size = round2(ti.size);
                } catch (e3) {}
            }
            try {
                style.fill = solidColorToObject(ti.color);
            } catch (e4) {}
            try {
                style.tracking = round2(ti.tracking);
            } catch (e5) {}
            try {
                style.leading = round2(ti.leading.as("px"));
            } catch (e6) {
                try {
                    if (ti.useAutoLeading) {
                        /* skip */
                    } else {
                        style.leading = round2(ti.leading);
                    }
                } catch (e7) {}
            }
        } catch (e8) {
            return null;
        }
        return style;
    }

    function parseArtLayer(layer) {
        if (!layer.visible) return null;
        var b = layerBoundsPx(layer);
        if (!b || !isInsideArtboard(b)) return null;

        var data;
        try {
            if (layer.kind === LayerKind.TEXT) {
                data = {
                    name: displayName(layer.name),
                    typename: "TextFrame",
                    visible: true,
                    bounds: boundsFromDoc(b),
                    contents: "",
                    textStyle: getTextStyle(layer)
                };
                try {
                    data.contents = String(layer.textItem.contents);
                } catch (e) {
                    data.contents = "";
                }
                return data;
            }
        } catch (eKind) {
            return null;
        }

        // 調整レイヤー等はスキップ
        try {
            if (
                layer.kind === LayerKind.BRIGHTNESSCONTRAST ||
                layer.kind === LayerKind.LEVELS ||
                layer.kind === LayerKind.CURVES ||
                layer.kind === LayerKind.EXPOSURE ||
                layer.kind === LayerKind.HUESATURATION ||
                layer.kind === LayerKind.COLORBALANCE ||
                layer.kind === LayerKind.PHOTOFILTER ||
                layer.kind === LayerKind.CHANNELMIXER ||
                layer.kind === LayerKind.INVERSION ||
                layer.kind === LayerKind.POSTERIZE ||
                layer.kind === LayerKind.THRESHOLD ||
                layer.kind === LayerKind.GRADIENTMAP ||
                layer.kind === LayerKind.SELECTIVECOLOR ||
                layer.kind === LayerKind.BLACKANDWHITE ||
                layer.kind === LayerKind.VIBRANCE
            ) {
                return null;
            }
        } catch (eAdj) {}

        // ピクセル / スマートオブジェクト / 塗りつぶし 等 → RasterItem
        data = {
            name: displayName(layer.name),
            typename: "RasterItem",
            visible: true,
            bounds: boundsFromDoc(b)
        };
        try {
            if (layer.kind === LayerKind.SMARTOBJECT) {
                data.smartObject = true;
            }
        } catch (eSo) {}
        return data;
    }

    function parseLayerSet(set) {
        if (!set.visible) return null;
        var b = layerBoundsPx(set);
        // グループは bounds が取れない／巨大なことがある → 子だけで判定
        var children = [];
        var i, child, parsed;
        for (i = 0; i < set.layers.length; i++) {
            child = set.layers[i];
            if (child.typename === "LayerSet") {
                parsed = parseLayerSet(child);
            } else {
                parsed = parseArtLayer(child);
            }
            if (parsed) children.push(parsed);
        }
        if (children.length === 0 && !isNamed(set.name)) return null;
        if (children.length === 0) return null;

        var data = {
            name: displayName(set.name),
            typename: "GroupItem",
            visible: true,
            children: children
        };
        if (b && isInsideArtboard(b)) {
            data.bounds = boundsFromDoc(b);
        }
        return data;
    }

    function parseDocumentLayers() {
        var result = [];
        var rootItems = [];
        var i, layer, parsed, layerData;

        for (i = 0; i < doc.layers.length; i++) {
            layer = doc.layers[i];
            if (layer.typename === "LayerSet") {
                parsed = parseLayerSet(layer);
                if (!parsed) continue;
                // トップのセットは layer エントリとして出す
                layerData = {
                    layerName: layer.name,
                    items: parsed.children && parsed.children.length ? parsed.children : [parsed],
                    subLayers: []
                };
                // Group として1つにまとめたい場合
                if (parsed.typename === "GroupItem") {
                    layerData.items = [parsed];
                }
                result.push(layerData);
            } else {
                parsed = parseArtLayer(layer);
                if (parsed) rootItems.push(parsed);
            }
        }

        if (rootItems.length) {
            result.unshift({
                layerName: "__root__",
                items: rootItems,
                subLayers: []
            });
        }
        return result;
    }

    var resultData = {
        meta: {
            purpose: "coding-assist",
            source: "photoshop",
            coordinate: "artboard-top-left, y-down",
            note: "Text must remain live Text layers. Rasterized type is omitted."
        },
        artboard: {
            name: ab.name,
            index: ab.index,
            width: round2(abRect[2] - abRect[0]),
            height: round2(abRect[3] - abRect[1])
        },
        layers: parseDocumentLayers()
    };

    var jsonString = jsonStringify(resultData);
    var saveFile = File.saveDialog("JSONファイルを保存", "*.json");
    if (saveFile) {
        saveFile.open("w");
        saveFile.encoding = "UTF-8";
        saveFile.write(jsonString);
        saveFile.close();
        alert(
            "アートボード「" + ab.name + "」をコーディング用 JSON に出力しました。（Photoshop）"
        );
    }
})();
