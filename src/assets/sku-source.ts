interface Texture {
    title: String;
    data: TextureData[]
}

interface TextureData {
    name: String;
    img: String;
    materialId: String;
    componentName: String;
}

interface Part {
    name: String;
    img: String;
}

interface Size {
    name: String;
    img: String;
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
    }[];
    Part?: String;
    Size?: String;
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

    [key: string]: OptionsDataTexture[];
}

interface OptionsDataTexture {
    title: String;
    data?: String[];
    image?: String;
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
    size: String;
    part: String;
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
                // 获取当前sku
                this.sku = (window as any).__VIEWER_INIT__.current.sku;
                // 获取当前brandgoodid
                const { brandGoodId, size, part } = this.getDefaultProductInfoBySku(this.sku);
                this.brandGoodId = brandGoodId;
                this.size = size;
                this.part = part;
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
                if (options.includes('Part') && optionsData.Part) {
                    this.uiViewData.parts = this.generatePartData(optionsData.Part);
                }
                if (options.includes('Size') && optionsData.Part) {
                    this.uiViewData.sizes = this.generateSizeData(optionsData.Size);
                }
            })
            .then(_ => {
                // 初始化表单视图
                this.initSubmitForm()
            })
            .then(_ => this.isInitialized = true)
    };

    resetModel = (brandGoodId: String) => {
        this.brandGoodId = brandGoodId;
        this.viewer.changeModel(brandGoodId);
    };

    getDefaultProductInfoBySku = (sku: String) => {
        const brandGood: Sku = this.coohomProduct.skus.filter(item => item.sku === sku)[0];
        return {
            brandGoodId: brandGood.obsBrandGoodId,
            size: brandGood.Size,
            part: brandGood.Part
        }
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
            envRotation: 2.5
        });

        this.viewer.start();
    };

    initSubmitForm = () => {
        const Sku = (window as any).Sku;
        new Sku({
            texture: this.getUIViewTexture(),
            part: this.getUIViewPart(),
            size: this.getUIViewSize()
        }, {
            el: document.getElementById('sku'),
            onTextureSelect: (texutre: TextureData) => {
                this.changeMaterial(texutre);
            },
            onPartSelect: function (part) {
                console.log('part', part);
            },
            onSizeSelect: function (size) {
                console.log('size', size);
            },
        })
    };

    generateTextureData = (items: OptionsDataTexture[]): Texture[] => {
        const data = items;
        const materials = this.coohomProduct.brandGoods[0].materials;
        return data.map(optionsDataTexture => {
            return {
                title: optionsDataTexture.title,
                data: optionsDataTexture.data.map(name => {
                    const seletedMaterial = materials.filter(item => item.name === name)[0];
                    if (seletedMaterial) {
                        return {
                            name: seletedMaterial.name,
                            img: seletedMaterial.thumbnail,
                            materialId: seletedMaterial.id,
                            componentName: optionsDataTexture.title
                        }
                    }
                    return;
                })
            }
        })
    };

    generatePartData = (parts: OptionsDataTexture[]): Part[] => {
        return parts.map(part => {
            return {
                name: part.title,
                img: part.image
            }
        })
    };

    generateSizeData = (sizes: OptionsDataTexture[]): Size[] => {
        return sizes.map(size => {
            return {
                name: size.title,
                img: size.image
            }
        })
    };

    getUIViewData = (): UIViewData => {
        return this.uiViewData;
    };

    getUIViewTexture = (): Texture[] => {
        return this.uiViewData.textures;
    };

    getUIViewPart = () => {
        return this.uiViewData.parts;
    };

    getUIViewSize = () => {
        return this.uiViewData.sizes;
    };

    getComponentIdByComponentName = (componentName: String) => {
        const bgid = this.brandGoodId;
        const brandGood = this.coohomProduct.brandGoods.filter(item => item.obsBrandGoodId === bgid)[0];
        const component = brandGood.components.filter(item => item.name === componentName)[0];
        return component && component.id;
    };

    changeMaterial = (texutre: TextureData) => {
        const { componentName, materialId  } = texutre;
        const componentId = this.getComponentIdByComponentName(componentName);
        this.viewer.changeMaterial(componentId, materialId);
    }
}

const main = () => {
    const currentProductId = (window as any).__VIEWER_INIT__.product.id;
    (window as any).viewerProduct = new ViewerProduct({
        productId: currentProductId
    });
};

main();
