interface Texture {
    title: String;
    data: TextureData[]
}

interface TextureData {
    name: String;
    img: String;
    materialId: String;
}

interface Part {
    brandGoodsId: String;
    name: String;
}

interface Size {
    brandGoodsId: String;
    name: String;
}

interface UIViewData {
    textures: Texture[],
    parts?: Part[],
    sizes?: Size[]
}

const coohomHttpClient = (function () {
    return axios.create({
        baseURL: 'https://www.coohom.com',
        timeout: 10000
    });
}());

interface Sku {
    obsBrandGoodId: string;
    sku: string;
    Texture: {
        materialId: string;
        componentId: string;
    }[]
}

interface Component {
    id: string;
    materials: string[];
    defaultMaterial: string;
    thumbnail: string;
    name: string;
}

interface Material {
    thumbnail: String;
    id: String;
    name: String;
}

interface BrandGood {
    obsBrandGoodId: String;
    components: Component[];
    modelViewerExtraInfo: {
        brandGoodName: String;
        brandName: String;
    };
    materials: Material[];
    designUrl: String;
}

interface OptionsData {
    Texture: OptionsDataTexture[];

    [key: string]: String[] | OptionsDataTexture[];
}

interface OptionsDataTexture {
    title: String;
    data: String[];
}

interface CoohomProduct {
    productid: String;
    options: String[];
    'options-data': OptionsData;
    skus: Sku[];
    brandGoods: BrandGood[];
    skuIndex: String[];

}

const getProductInfoFromCoohom = (productId: String): Promise<CoohomProduct> => {
    return coohomHttpClient.get('/faas/shopify-product', {
        params: {
            pid: productId
        }
    }).then(res => res.data)
};

interface ViewProductInterface {
    productId: String;

    getUIViewData: () => UIViewData; // get ui data
    // resetModel: (brandGoodId: String) => void;

}

interface ViewProductOptions {
    productId: String
}

class ViewerProduct implements ViewProductInterface {
    productId: String;
    coohomProduct: CoohomProduct;
    brandGoodId: String;
    sku: String;
    uiViewData: UIViewData;
    viewer: any;
    isInitialized: boolean = false;

    constructor(options: ViewProductOptions) {
        this.productId = options.productId;
        this.init();
    }

    init = () => {
        if (this.isInitialized) {
            return
        }
        getProductInfoFromCoohom(this.productId)
            .then(coohomProduct => this.coohomProduct = coohomProduct)
            .then(_ => {
                this.sku = (window as any).__VIEWER_INIT__.current.sku;
                // 获取当前brandgoodid
                this.brandGoodId = this.getBrandGoodIdBySku(this.sku);
                // 初始化viewer
                this.initViewer();
            })
            .then(_ => {
                // 初始化ui数据
                const optionsData = this.coohomProduct['options-data'];
                const options = Object.keys(optionsData);
                this.uiViewData = {
                    textures: []
                };
                this.uiViewData.textures = this.generateTextureData(optionsData.Texture);
            })
            .then(_ => this.isInitialized = true)
    };

    resetModel = (brandGoodId: String) => {

    };

    getBrandGoodIdBySku = (sku: String): string => {
        return this.coohomProduct.skus.filter(item => item.sku === sku)[0].obsBrandGoodId;
    };

    getSku = () => {
        return this.sku;
    };

    initViewer = () => {
        const lucy = (window as any).lucy;
        if (!lucy) {
            console.warn(
                '"window.lucy" does not exist. Please ensure you\'ve added the <script> to your theme'
            );
            return;
        }
        this.viewer = (window as any).viewer = new lucy.ViewerSDK({
            mount: document.getElementById('lucy-viewer'),
            modelId: this.brandGoodId,
            defaultZoomScale: 0.49,
        });

        this.viewer.start();
    };

    generateTextureData = (items: OptionsDataTexture[]): Texture[] => {
        const data = items;
        const materials = this.coohomProduct.brandGoods[0].materials;
        return data.map(optionsDataTexture => {
            return {
                title: optionsDataTexture.title,
                data: optionsDataTexture.data.map(item => {
                    const seletedMaterial = materials.filter(item => item.name === name)[0];
                    if (seletedMaterial) {
                        return {
                            name: seletedMaterial.name,
                            img: seletedMaterial.thumbnail,
                            materialId: seletedMaterial.id
                        }
                    }
                    return;
                })
            }
        })
    };

    getUIViewData = (): UIViewData => {
        return this.uiViewData;
    };

    getUIViewTexture = (): Texture[] => {
        return this.uiViewData.textures;
    };
}

const main = () => {
    const currentProductId = (window as any).__VIEWER_INIT__.product.id;
    const viewerProduct = new ViewerProduct({
        productId: currentProductId
    });
};

main();
