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
        this.init = function () {
            if (_this.isInitialized) {
                return;
            }
            getProductInfoFromCoohom(_this.productId)
                .then(function (coohomProduct) { return _this.coohomProduct = coohomProduct; })
                .then(function (_) {
                // 获取当前sku
                _this.sku = window.__VIEWER_INIT__.current.sku;
                // 获取当前brandgoodid
                var _a = _this.getDefaultProductInfoBySku(_this.sku), brandGoodId = _a.brandGoodId, size = _a.size, part = _a.part;
                _this.brandGoodId = brandGoodId;
                _this.size = size;
                _this.part = part;
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
                .then(function (_) { return _this.isInitialized = true; });
        };
        this.getDefaultProductInfoBySku = function (sku) {
            var brandGood = _this.coohomProduct.skus.filter(function (item) { return item.sku === sku; })[0];
            return {
                brandGoodId: brandGood.obsBrandGoodId,
                size: brandGood.Size,
                part: brandGood.Part
            };
        };
        this.getSku = function () {
            return _this.sku;
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
                envRotation: 2.5
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
                    var isChanged = false;
                    for (var i = 0; i < _this.texture.length; i++) {
                        if (_this.texture[i].componentName === texture.componentName) {
                            _this.texture[i] = texture;
                            isChanged = true;
                        }
                    }
                    if (!isChanged) {
                        _this.texture.push(texture);
                    }
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
                    _this.part = part.name;
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
                    _this.size = size.name;
                },
            });
        };
        this.resetModel = function (brandGoodId) {
            _this.brandGoodId = brandGoodId;
            return _this.viewer.changeModel(brandGoodId);
        };
        this.generateTextureData = function (items) {
            var data = items;
            var materials = _this.coohomProduct.brandGoods[0].materials;
            return data.map(function (optionsDataTexture) {
                return {
                    title: optionsDataTexture.title,
                    data: optionsDataTexture.data.map(function (name) {
                        var seletedMaterial = materials.filter(function (item) { return item.name === name; })[0];
                        if (seletedMaterial) {
                            return {
                                name: seletedMaterial.name,
                                img: seletedMaterial.thumbnail,
                                materialId: seletedMaterial.id,
                                componentName: optionsDataTexture.title
                            };
                        }
                        return;
                    })
                };
            });
        };
        this.generatePartData = function (parts) {
            return parts.map(function (part) {
                return {
                    name: part.title,
                    img: part.image
                };
            });
        };
        this.generateSizeData = function (sizes) {
            return sizes.map(function (size) {
                return {
                    name: size.title,
                    img: size.image
                };
            });
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
        this.getTargetBrandGood = function (opt) {
            var currentInfo = {
                size: _this.size,
                part: _this.part
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
