interface Texture {
    title: String;
    data: TextureData[];
    position?: String;
}

interface TextureData {
    name?: String;
    img?: String;
    materialId: String;
    componentName?: String;
    position?: String;
    componentId?: String;
}

interface Part {
    name: String;
    img?: String;
    position?: String;
}

interface Size {
    name: String;
    img?: String;
    position?: String;
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
    Size: String;
    Part: String;
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
    size?: Size;
    part?: Part;
    texture: TextureData[] = [];
    isInitialized: boolean = false;
    isChangingModel: boolean = false;

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
                const { brandGoodId, size, part, texture } = this.getDefaultProductInfoBySku(this.sku);
                this.brandGoodId = brandGoodId;
                this.size = size;
                this.part = part;
                this.texture = texture;
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

    getDefaultProductInfoBySku = (sku: String) => {
        const brandGood: Sku = this.coohomProduct.skus.filter(item => item.sku === sku)[0];
        const optionsData = this.coohomProduct['options-data'];
        const options = Object.keys(optionsData);
        const texture = brandGood.Texture.map((item, index) => {
            return {
                position: `1_${index + 1}_1`,
                componentName: this.coohomProduct['options-data'].Texture[index].title,
                ...item
            }
        });
        let size, part;
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
            size,
            part,
            texture
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
            brightness: 1.5,
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
            onTextureSelect: (texture: TextureData, isIniting: boolean) => {
                if (isIniting) {
                    return
                }
                this.changeMaterial(texture);
                for(let i = 0; i < this.texture.length; i++) {
                    if (this.texture[i].componentName === texture.componentName) {
                        this.texture[i] = texture;
                    }
                }
                console.log(texture);
                console.log(this.texture);
                this.generateSku();
            },
            onPartSelect: (part: {
                name: String,
                img: String
            }, isIniting: boolean) => {
                if (isIniting) {
                    return
                }
                const targetBrandGood = this.getTargetBrandGood({
                    part: part.name
                });
                this.resetModel(targetBrandGood.obsBrandGoodId).then(_ => {
                    this.texture.forEach(item => {
                        this.changeMaterial(item)
                    })
                });
                this.part = part;
                this.generateSku();
            },
            onSizeSelect: (size: {
                name: String,
                img: String
            }, isIniting: boolean) => {
                if (isIniting) {
                    return
                }
                const targetBrandGood = this.getTargetBrandGood({
                    size: size.name
                });
                this.resetModel(targetBrandGood.obsBrandGoodId).then(_ => {
                    this.texture.forEach(item => {
                        this.changeMaterial(item)
                    })
                });
                this.size = size;
                this.generateSku();
            },
        })
    };

    resetModel = (brandGoodId: String) => {
        if (this.isChangingModel) {
            return ;
        }
        this.isChangingModel = true;
        this.brandGoodId = brandGoodId;
        return this.viewer.changeModel(brandGoodId).then(_ => this.isChangingModel = false);
    };


    generateTextureData = (items: OptionsDataTexture[]): Texture[] => {
        const data = items;
        const materials = this.coohomProduct.brandGoods[0].materials;
        return data.map((optionsDataTexture, index) => {
            return {
                title: optionsDataTexture.title,
                position: `1_${index + 1}`,
                data: optionsDataTexture.data.map((name, index2) => {
                    const seletedMaterial = materials.filter(item => item.name === name)[0];
                    if (seletedMaterial) {
                        return {
                            name: seletedMaterial.name,
                            img: seletedMaterial.thumbnail,
                            materialId: seletedMaterial.id,
                            componentName: optionsDataTexture.title,
                            position: `1_${index + 1}_${index2 + 1}`
                        }
                    }
                    return;
                })
            }
        })
    };

    generatePartData = (parts: OptionsDataTexture[]): Part[] => {
        return parts.map((part, index) => {
            return {
                name: part.title,
                img: part.image,
                position: `2_${index + 1}`
            }
        })
    };

    generateSizeData = (sizes: OptionsDataTexture[]): Size[] => {
        return sizes.map((size, index) => {
            return {
                name: size.title,
                img: size.image,
                position: `3_${index + 1}`
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

    getTargetBrandGood = (opt: {
        size?: String;
        part?: String;
    }) => {
        const currentInfo = {
            size: this.size.name,
            part: this.part.name
        };
        const targetInfo = Object.assign({}, currentInfo, opt);
        const targetBrandGood = this.coohomProduct.brandGoods.filter(item => (item.Size === targetInfo.size) && (item.Part === targetInfo.part))
        return targetBrandGood[0];
    };

    getComponentIdByComponentName = (componentName: String) => {
        const bgid = this.brandGoodId;
        const brandGood = this.coohomProduct.brandGoods.filter(item => item.obsBrandGoodId === bgid)[0];
        const component = brandGood.components.filter(item => item.name === componentName)[0];
        return component && component.id;
    };

    changeMaterial = (texutre: TextureData) => {
        const { componentName, materialId } = texutre;
        const componentId = this.getComponentIdByComponentName(componentName);
        this.viewer.changeMaterial(componentId, materialId);
    };

    generateSku = () => {
        const { texture, size, part } = this;
        const skuQuery = texture.map(item => item.position).join('-') + (part ? `-${part.position}`: '') + (size ? `-${size.position}` : '');
        this.sku = this.coohomProduct.skuIndex[skuQuery];
        if (this.sku) {
            const productInfo = (window as any).productInfo;
            const variant = productInfo.variants.filter(item => item.sku === this.sku )[0];
            (window as any).__VIEWER_INIT__.variant._onSelectChange(variant)
        }
    }
}


const main = () => {
    const currentProductId = (window as any).__VIEWER_INIT__.product.id;
    (window as any).viewerProduct = new ViewerProduct({
        productId: currentProductId
    });
};

main();
