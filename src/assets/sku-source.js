var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var coohomHttpClient = (function () {
    return axios.create({
        baseURL: 'https://www.coohom.com',
        timeout: 10000
    });
}());
var getProductInfoFromCoohom = function (productId) {
    return coohomHttpClient.get('/faas/shopify-product', {
        params: {
            pid: productId
        }
    }).then(function (res) { return res.data; });
};
var ViewerProduct = /** @class */ (function () {
    function ViewerProduct(options) {
        var _this = this;
        this.texture = [];
        this.isInitialized = false;
        this.isChangingModel = false;
        this.init = function () {
            if (_this.isInitialized) {
                return;
            }
            return getProductInfoFromCoohom(_this.productId)
                .then(function (coohomProduct) { return _this.coohomProduct = coohomProduct; })
                .then(function (_) {
                // 获取当前sku
                _this.sku = window.__VIEWER_INIT__.current.sku;
                // 获取当前brandgoodid
                var _a = _this.getDefaultProductInfoBySku(_this.sku), brandGoodId = _a.brandGoodId, size = _a.size, part = _a.part, texture = _a.texture;
                _this.brandGoodId = brandGoodId;
                _this.size = size;
                _this.part = part;
                _this.texture = texture;
                // 初始化viewer
                _this.initViewer();
            })
                .then(function (_) {
                // 初始化ui数据
                var optionsData = _this.coohomProduct['options-data'];
                var options = Object.keys(optionsData);
                _this.uiViewData = {
                    textures: []
                };
                _this.uiViewData.textures = _this.generateTextureData(optionsData.Texture);
                if (options.includes('Part') && optionsData.Part) {
                    _this.uiViewData.parts = _this.generatePartData(optionsData.Part);
                }
                if (options.includes('Size') && optionsData.Part) {
                    _this.uiViewData.sizes = _this.generateSizeData(optionsData.Size);
                }
            })
                .then(function (_) {
                // 初始化表单视图
                _this.initSubmitForm();
            })
                .then(function (_) {
                _this.isInitialized = true;
                return _this.isInitialized;
            })
                .catch(function (e) {
                console.error('Viewer Init Error:' + e);
                return false;
            });
        };
        this.getDefaultProductInfoBySku = function (sku) {
            var brandGood = _this.coohomProduct.skus.filter(function (item) { return item.sku === sku; })[0];
            var optionsData = _this.coohomProduct['options-data'];
            var options = Object.keys(optionsData);
            var texture = brandGood.Texture.map(function (item, index) {
                return __assign({ position: "1_" + (index + 1) + "_1", componentName: _this.coohomProduct['options-data'].Texture[index].title }, item);
            });
            var size, part;
            if (options.includes('Size')) {
                size = {
                    position: '3_1',
                    name: brandGood.Size
                };
            }
            if (options.includes('Part')) {
                part = {
                    position: '2_1',
                    name: brandGood.Part
                };
            }
            return {
                brandGoodId: brandGood.obsBrandGoodId,
                size: size,
                part: part,
                texture: texture
            };
        };
        this.getSku = function () {
            return _this.sku;
        };
        this.getCoohomProduct = function () {
            return _this.coohomProduct;
        };
        this.getUIViewData = function () {
            return _this.uiViewData;
        };
        this.getUIViewTexture = function () {
            return _this.uiViewData.textures;
        };
        this.getUIViewPart = function () {
            return _this.uiViewData.parts;
        };
        this.getUIViewSize = function () {
            return _this.uiViewData.sizes;
        };
        this.initViewer = function () {
            var lucy = window.lucy;
            if (!lucy) {
                console.warn('"window.lucy" does not exist. Please ensure you\'ve added the <script> to your theme');
                return;
            }
            _this.viewer = window.viewer = new lucy.ViewerSDK({
                mount: document.getElementById('lucy-viewer'),
                modelId: _this.brandGoodId,
                defaultZoomScale: 0.49,
                useCoohomCDN: location.hostname !== 'shop.coohom.com',
                locale: 'en_US'
            });
            _this.viewer.start();
        };
        this.initSubmitForm = function () {
            var Sku = window.Sku;
            new Sku({
                texture: _this.getUIViewTexture(),
                part: _this.getUIViewPart(),
                size: _this.getUIViewSize()
            }, {
                el: document.getElementById('sku'),
                onTextureSelect: function (texture, isIniting) {
                    if (isIniting) {
                        return;
                    }
                    _this.changeMaterial(texture);
                    for (var i = 0; i < _this.texture.length; i++) {
                        if (_this.texture[i].componentName === texture.componentName) {
                            _this.texture[i] = texture;
                        }
                    }
                    console.log(texture);
                    console.log(_this.texture);
                    _this.generateSku();
                },
                onPartSelect: function (part, isIniting) {
                    if (isIniting) {
                        return;
                    }
                    var targetBrandGood = _this.getTargetBrandGood({
                        part: part.name
                    });
                    _this.resetModel(targetBrandGood.obsBrandGoodId).then(function (_) {
                        _this.texture.forEach(function (item) {
                            _this.changeMaterial(item);
                        });
                    });
                    _this.part = part;
                    _this.generateSku();
                },
                onSizeSelect: function (size, isIniting) {
                    if (isIniting) {
                        return;
                    }
                    var targetBrandGood = _this.getTargetBrandGood({
                        size: size.name
                    });
                    _this.resetModel(targetBrandGood.obsBrandGoodId).then(function (_) {
                        _this.texture.forEach(function (item) {
                            _this.changeMaterial(item);
                        });
                    });
                    _this.size = size;
                    _this.generateSku();
                },
            });
        };
        this.resetModel = function (brandGoodId) {
            if (_this.isChangingModel) {
                return;
            }
            _this.isChangingModel = true;
            _this.brandGoodId = brandGoodId;
            return _this.viewer.changeModel(brandGoodId).then(function (_) {
                _this.isChangingModel = false;
            });
        };
        this.generateTextureData = function (items) {
            var data = items;
            var materials = _this.coohomProduct.brandGoods[0].materials;
            return data.map(function (optionsDataTexture, index) {
                return {
                    title: optionsDataTexture.title,
                    position: "1_" + (index + 1),
                    data: optionsDataTexture.data.map(function (name, index2) {
                        var seletedMaterial = materials.filter(function (item) { return item.name === name; })[0];
                        if (seletedMaterial) {
                            return {
                                name: seletedMaterial.name,
                                img: seletedMaterial.thumbnail,
                                materialId: seletedMaterial.id,
                                componentName: optionsDataTexture.title,
                                position: "1_" + (index + 1) + "_" + (index2 + 1)
                            };
                        }
                        return;
                    })
                };
            });
        };
        this.generatePartData = function (parts) {
            return parts.map(function (part, index) {
                return {
                    name: part.title,
                    img: part.image,
                    position: "2_" + (index + 1)
                };
            });
        };
        this.generateSizeData = function (sizes) {
            return sizes.map(function (size, index) {
                return {
                    name: size.title,
                    img: size.image,
                    position: "3_" + (index + 1)
                };
            });
        };
        this.getTargetBrandGood = function (opt) {
            var currentInfo = {
                size: _this.size.name,
                part: _this.part.name
            };
            var targetInfo = Object.assign({}, currentInfo, opt);
            var targetBrandGood = _this.coohomProduct.brandGoods.filter(function (item) { return (item.Size === targetInfo.size) && (item.Part === targetInfo.part); });
            return targetBrandGood[0];
        };
        this.getComponentIdByComponentName = function (componentName) {
            var bgid = _this.brandGoodId;
            var brandGood = _this.coohomProduct.brandGoods.filter(function (item) { return item.obsBrandGoodId === bgid; })[0];
            var component = brandGood.components.filter(function (item) { return item.name === componentName; })[0];
            return component && component.id;
        };
        this.changeMaterial = function (texutre) {
            var componentName = texutre.componentName, materialId = texutre.materialId;
            var componentId = _this.getComponentIdByComponentName(componentName);
            _this.viewer.changeMaterial(componentId, materialId);
        };
        this.generateSku = function () {
            var _a = _this, texture = _a.texture, size = _a.size, part = _a.part;
            var skuQuery = texture.map(function (item) { return item.position; }).join('-') + (part ? "-" + part.position : '') + (size ? "-" + size.position : '');
            _this.sku = _this.coohomProduct.skuIndex[skuQuery];
            if (_this.sku) {
                var productInfo = window.productInfo;
                var variant = productInfo.variants.filter(function (item) { return item.sku === _this.sku; })[0];
                window.__VIEWER_INIT__.variant._onSelectChange(variant);
            }
        };
        this.productId = options.productId;
        this.init();
    }
    return ViewerProduct;
}());
var main = function () {
    var currentProductId = window.__VIEWER_INIT__.product.id;
    window.viewerProduct = new ViewerProduct({
        productId: currentProductId
    });
};
main();
