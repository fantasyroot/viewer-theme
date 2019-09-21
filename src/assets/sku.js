var coohomHttpClient = (function () {
    return axios.create({
        baseURL: 'https://www.coohom.com',
        timeout: 10000
    });
}());

/**
 *  Viewer use APIs
 */
/**
 * get product info from coohom
 * @param productId {@type string}
 */
function getProductInfoFromCoohom(productId) {
    return coohomHttpClient.get('/faas/shopify-product', {
        params: {
            pid: productId
        }
    })
}

function formatProductData(product) {
    var coohomProduct = product;


}


/**
 * Class ViewerProduct
 * @param productid
 * @return {{productId: (*|string), textures: Array, size: Array, parts: Array, currentProduct}}
 * @constructor
 */
function ViewerProduct(productid) {
    var self = this;
    var coohomProduct = {};
    console.log(window.__VIEWER_INIT__)
    var shopifyProduct = window.__VIEWER_INIT__.product;

    this.currentProduct = window.__VIEWER_INIT__.current || {};
    this.productId = productid || '';
    this.textures = [];
    this.parts = [];
    this.size = [];

    // get product info from coohom
    getProductInfoFromCoohom(self.productId).then(function (res) {
        coohomProduct = res.data;
    }).then(function () {
        if (!Array.isArray(coohomProduct.skus) || !Array.isArray(coohomProduct.brandGoods)) {
            throw new Error('Sku or brandGoods is not exist!')
        }
    }).catch(function (reason) {
        console.error('Viewer Product init error: ' + reason.message)
    })
}

/**
 * get current product
 * @return {{}|*}
 */
ViewerProduct.prototype.getCurrentProduct = function () {
    return this.currentProduct;
};
/**
 * get sku
 * @return {Sku|Sku}
 */
ViewerProduct.prototype.getSku = function () {
    return this.currentProduct.sku;
};

ViewerProduct.prototype.initViewer = function () {

};

ViewerProduct.prototype.changeMaterial = function () {

};

ViewerProduct.prototype.changeModel = function () {

};

ViewerProduct.prototype.resetModel = function () {

};
/**
 * get textures array for ui
 */
ViewerProduct.prototype.getTextures = function () {
    return this.textures;
};

ViewerProduct.prototype.getDefaultProductInfo = function () {
    var defaultSku = this.getSku();
    var defaultProduct = {};
    this.currentProduct.skus.every(function (sku) {
        if (sku === defaultSku) {

        }
    })
};

function init() {
    var currentProductId = window.__VIEWER_INIT__.product.id;
    var viewerProduct = new ViewerProduct(currentProductId);


}

init();
