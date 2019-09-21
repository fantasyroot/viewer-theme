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
                _this.brandGoodId = _this.getBrandGoodIdBySku(_this.sku);
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
            })
                .then(function (_) {
                _this.initSubmitForm();
            })
                .then(function (_) { return _this.isInitialized = true; });
        };
        this.resetModel = function (brandGoodId) {
        };
        this.getBrandGoodIdBySku = function (sku) {
            return _this.coohomProduct.skus.filter(function (item) { return item.sku === sku; })[0].obsBrandGoodId;
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
                defaultZoomScale: 0.3,
            });
            _this.viewer.start();
        };
        this.initSubmitForm = function () {
            var Sku = window.Sku;
            new Sku({
                texture: _this.getUIViewTexture()
            }, {
                el: document.getElementById('sku'),
                onTextureSelect: function (texutre) {
                    console.log('texture', texutre);
                },
                onPartSelect: function (part) {
                    console.log('part', part);
                },
                onSizeSelect: function (size) {
                    console.log('size', size);
                },
            });
        };
        this.generateTextureData = function (items) {
            var data = items;
            var materials = _this.coohomProduct.brandGoods[0].materials;
            return data.map(function (optionsDataTexture) {
                return {
                    title: optionsDataTexture.title,
                    data: optionsDataTexture.data.map(function (item) {
                        var seletedMaterial = materials.filter(function (item) { return item.name === name; })[0];
                        if (seletedMaterial) {
                            return {
                                name: seletedMaterial.name,
                                img: seletedMaterial.thumbnail,
                                materialId: seletedMaterial.id
                            };
                        }
                        return;
                    })
                };
            });
        };
        this.getUIViewData = function () {
            return _this.uiViewData;
        };
        this.getUIViewTexture = function () {
            return _this.uiViewData.textures;
        };
        this.productId = options.productId;
        this.init();
    }
    return ViewerProduct;
}());
var main = function () {
    var currentProductId = window.__VIEWER_INIT__.product.id;
    var viewerProduct = new ViewerProduct({
        productId: currentProductId
    });
};
main();
