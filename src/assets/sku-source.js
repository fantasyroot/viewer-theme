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
        this.resetModel = function (brandGoodId) {
        };
        this.productId = options.productId;
        getProductInfoFromCoohom(this.productId)
            .then(function (coohomProduct) { return _this.coohomProduct = coohomProduct; });
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
