/**
 * 管理整个SKU模块
 *
 * @param {{ texture: [], part: [], size: [] }} data
 * @param {{ el: HTMLElement, onTextureSelect: (texture: any) => void, onPartSelect: (any) => void, onSizeSelect: (size: any) => void }} option
 */
function Sku(data, option) {
    if (data.texture) {
        this.texture = new SkuPanel(data.texture, {
            parent: option.el,
            title: 'Choose Texture',
            index: '1',
            open: true,
            onItemSelect: option.onTextureSelect,
            onOpen: (function () {
                this.part && this.part.close();
                this.size && this.size.close();
            }).bind(this),
            List: TextureList,
        });
    }

    if (data.part) {
        this.part = new SkuPanel(data.part, {
            parent: option.el,
            title: 'Choose Parts',
            index: '2',
            open: false,
            onItemSelect: option.onPartSelect,
            onOpen: (function () {
                this.texture && this.texture.close();
                this.size && this.size.close();
            }).bind(this),
            List: PartList,
        });
    }

    if (data.size) {
        this.size = new SkuPanel(data.size, {
            parent: option.el,
            title: 'Choose Size',
            index: '3',
            open: false,
            onItemSelect: option.onSizeSelect,
            onOpen: (function () {
                this.texture && this.texture.close();
                this.part && this.part.close();
            }).bind(this),
            // List: SizeList,
            List: PartList,
        });
    }
    //
    this.texture.open();
}


/**
 * 管理某一类SKU
 *
 * @param {any[]} items
 * @param {{ parent: HTMLElement, title: string, index: string, open: boolean, onItemSelect: (item: any) => void, onOpen: () => void, List: Function }} option
 */
function SkuPanel(items, option) {
    this.items = [];
    this.option = option;
    this.render();
    this.list = new option.List(items, {
        onSelect: option.onItemSelect,
        parent: this.el,
    });

    this.isOpen = option.open;
}

SkuPanel.prototype.open = function () {
    this.el.classList.add('ch-drawer--open');
    this.isOpen = true;
    this.option.onOpen();
    this.list.open();
}

SkuPanel.prototype.close = function () {
    this.el.classList.remove('ch-drawer--open');
    this.isOpen = false;
    this.list.close();
}

SkuPanel.prototype.render = function () {
    const drawer = createElement('div', ['ch-drawer']);
    this.option.parent.appendChild(drawer);

    const title = this.createTitle();
    drawer.appendChild(title);
    this.el = drawer;

    const panel = this;
    title.onclick = function () {
        if (panel.isOpen) {
            panel.close();
        } else {
            panel.open();
        }
    }
}

SkuPanel.prototype.createTitle = function () {
    const title = createElement('div', ['ch-drawer__title']);
    title.appendChild(createElement('span', ['ch-drawer__index'], this.option.index));
    title.appendChild(createElement('span', ['ch-drawer__name'], this.option.title));
    title.appendChild(createElement('span', ['ch-drawer__arrow']));


    return title;
}

/**
 * 管理Texture的组件
 *
 * @param {{ title: string, data: { img: string, name: string }[] }[]} textureList
 * @param {{ parent: HTMLElement, onSelect: (texture: object) => void }} option
 */
function TextureList(textureList, option) {
    this.list = textureList;
    this.option = option;
    this.render();
    this.selectFirst();
}

TextureList.prototype.open = function () {
    this.option.parent.classList.remove('ch-drawer--hidden');
}

TextureList.prototype.close = function () {
    this.option.parent.classList.add('ch-drawer--hidden');
}

TextureList.prototype.render = function () {
    const content = createElement('div', ['ch-drawer__content', 'ch-drawer--hidden']);
    this.option.parent.appendChild(content);
    this.el = content;
    this.nodes = [];

    for (const textureRow of this.list) {
        const row = createElement('div', ['ch-drawer__row']);
        content.appendChild(row);

        const title = createElement('div', ['ch-drawer__row-title'], textureRow.title);
        row.appendChild(title);

        const wrapper = createElement('div', ['ch-drawer__row-wrapper']);
        row.appendChild(wrapper);

        textureRow.nodes = [];

        const t = this;
        textureRow.data.forEach(function (d) {
            const item = createElement('div', ['ch-drawer__row-item']);
            wrapper.appendChild(item);

            // t.nodes.push({
            //     data: d,
            //     el: item,
            // });

            textureRow.nodes.push({
                data: d,
                el: item,
            });

            item.onclick = function () {
                t.selectItem(d, textureRow);
            }

            const itemImg = createElement('div', ['ch-drawer__row-item-img']);
            item.appendChild(itemImg);
            const img = createElement('img', []);
            img.src = d.img + '?x-oss-process=image/resize,m_lfit,h_144,w_144';
            itemImg.appendChild(img);
            const icon = createElement('div', ['ch-drawer__row-item-selected-icon']);
            itemImg.appendChild(icon);
            const name = createElement('span', ['ch-drawer__row-item-name'], d.name);
            item.appendChild(name);
        });
    }
}

TextureList.prototype.selectFirst = function () {
    for (const row of this.list) {
        this.selectItem(row.data[0], row, true);
    }
}

TextureList.prototype.selectItem = function (d, textureRow, isInitial) {
    this.option.onSelect(d, isInitial);

    for (const n of textureRow.nodes) {
        if (n.data === d) {
            n.el.classList.add('ch-drawer__row-item--selected');
        } else {
            n.el.classList.remove('ch-drawer__row-item--selected');
        }
    }
}

/**
 * 管理部件的组件
 *
 * @param {{ name: string, img: string }[]} part
 * @param {{ parent: HTMLElement, onSelect: (part: object) => void }} option
 */
function PartList(list, option) {
    this.list = list;
    this.option = option;
    this.render();
    this.selectFirst();
}

PartList.prototype.open = function () {
    this.option.parent.classList.remove('ch-drawer--hidden');
}

PartList.prototype.close = function () {
    this.option.parent.classList.add('ch-drawer--hidden');
}

PartList.prototype.render = function () {
    const content = createElement('div', ['ch-drawer__content', 'ch-drawer--hidden']);
    const grid = createElement('div', ['ch-drawer__grid']);
    content.appendChild(grid);
    this.option.parent.appendChild(content);
    this.el = content;
    this.nodes = [];

    const t = this;
    this.list.forEach(function (d) {
        const item = createElement('div', ['ch-drawer__row-item']);
        grid.appendChild(item);

        t.nodes.push({
            data: d,
            el: item,
        });

        item.onclick = function () {
            t.selectItem(d);
        }

        const itemImg = createElement('div', ['ch-drawer__row-item-img']);
        item.appendChild(itemImg);
        const img = createElement('img', []);
        img.src = d.img + '?x-oss-process=image/resize,m_lfit,h_144,w_144';
        itemImg.appendChild(img);
        const icon = createElement('div', ['ch-drawer__row-item-selected-icon']);
        itemImg.appendChild(icon);
        const name = createElement('span', ['ch-drawer__row-item-name'], d.name);
        item.appendChild(name);
    });
}

PartList.prototype.selectFirst = function () {
    this.selectItem(this.list[0], true);
}

PartList.prototype.selectItem = function (d, isInitial) {
    this.option.onSelect(d, isInitial);

    for (const n of this.nodes) {
        if (n.data === d) {
            n.el.classList.add('ch-drawer__row-item--selected');
        } else {
            n.el.classList.remove('ch-drawer__row-item--selected');
        }
    }
}

/**
 * 管理部件的组件
 *
 * @param {{ size: string }[]} list
 * @param {{ parent: HTMLElement, onSelect: (part: object) => void }} option
 */
function SizeList(list, option) {
    this.list = list;
    this.option = option;
    this.render();
    this.selectFirst();
}

SizeList.prototype.open = function () {
    this.option.parent.classList.remove('ch-drawer--hidden');
}

SizeList.prototype.close = function () {
    this.option.parent.classList.add('ch-drawer--hidden');
}

SizeList.prototype.render = function () {
    const content = createElement('div', ['ch-drawer__content', 'ch-drawer--hidden']);
    const wrapper = createElement('div', ['ch-drawer__size']);
    content.appendChild(wrapper);
    this.option.parent.appendChild(content);
    this.el = content;
    this.nodes = [];

    const t = this;
    this.list.forEach(function (d) {
        const item = createElement('div', ['ch-drawer__row-item']);
        wrapper.appendChild(item);
        const text = createElement('span', [], d.size);
        item.appendChild(text);

        t.nodes.push({
            data: d,
            el: item,
        });

        item.onclick = function () {
            t.selectItem(d);
        }
    });
}

SizeList.prototype.selectFirst = function () {
    this.selectItem(this.list[0], true);
}

SizeList.prototype.selectItem = function (d, isInitial) {
    this.option.onSelect(d, isInitial);

    for (const n of this.nodes) {
        if (n.data === d) {
            n.el.classList.add('ch-drawer__row-item--selected');
        } else {
            n.el.classList.remove('ch-drawer__row-item--selected');
        }
    }
}


/**
 *
 *
 * @param {string} tagName
 * @param {string[]} classList
 * @param {string?} content
 */
function createElement(tagName, classList, content) {
    const el = document.createElement(tagName);
    classList.forEach(function (c) {
        el.classList.add(c);
    })

    if (content) {
        el.textContent = content;
    }

    return el;
}

function main() {
    // window.sku = new Sku({
    //     texture: [
    //         {
    //             title: '1.1 Sofa Body',
    //             data: [
    //                 {
    //                     name: 'Mist',
    //                     img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg',
    //                 },
    //                 {
    //                     name: 'Mist',
    //                     img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg',
    //                 },
    //                 {
    //                     name: 'Mist',
    //                     img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg',
    //                 },
    //                 {
    //                     name: 'Mist',
    //                     img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg',
    //                 },
    //                 {
    //                     name: 'Mist',
    //                     img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg',
    //                 },
    //                 {
    //                     name: 'Mist',
    //                     img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg',
    //                 },
    //                 {
    //                     name: 'Mist',
    //                     img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg',
    //                 },
    //                 {
    //                     name: 'Mist',
    //                     img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg',
    //                 },
    //                 {
    //                     name: 'Mist',
    //                     img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg',
    //                 },
    //                 {
    //                     name: 'Mist',
    //                     img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg',
    //                 },
    //                 {
    //                     name: 'Mist',
    //                     img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg',
    //                 },
    //                 {
    //                     name: 'Mist',
    //                     img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg',
    //                 },
    //             ],
    //         }, {
    //             title: '1.2 Seat Cushion',
    //             data: [
    //                 {
    //                     name: 'Mist',
    //                     img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg',
    //                 },
    //                 {
    //                     name: 'Mist',
    //                     img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg',
    //                 },
    //             ],
    //         }
    //     ],
    //     part: [
    //         { name: 'Natural Oak', img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg' },
    //         { name: 'Natural Oak', img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg' },
    //         { name: 'Natural Oak', img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg' },
    //         { name: 'Natural Oak', img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg' },
    //         { name: 'Natural Oak', img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg' },
    //         { name: 'Natural Oak', img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg' },
    //         { name: 'Natural Oak', img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg' },
    //         { name: 'Natural Oak', img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg' },
    //         { name: 'Natural Oak', img: 'https://d2cquv6wfilehq.cloudfront.net/media/catalog/product/cache/1/image/9df78eab33525d08d6e5fb8d27136e95/f/l/fleck_terra.jpg' },
    //     ],
    //     size: [
    //         { size: '86' },
    //         { size: '86' },
    //         { size: '86' },
    //     ],
    // }, {
    //     el: document.getElementById('sku'),
    //     onTextureSelect: function (texutre) {
    //         console.log('texture', texutre);
    //     },
    //     onPartSelect: function (part) {
    //         console.log('part', part);
    //     },
    //     onSizeSelect: function (size) {
    //         console.log('size', size);
    //     },
    // });

    bindScroll();
    initViewSelector();
}

function bindScroll() {
    function scroll(anchor, target) {
        this.document.getElementById(anchor).onclick = function () {
            const el = document.getElementById(target);
            window.scrollTo({
                top: el.getBoundingClientRect().top + window.scrollY,
                behavior: 'smooth',
            });
        }
    }

    scroll('ch-anchor-gallery', 'ch-target-gallery');
    scroll('ch-anchor-desp', 'ch-target-desp');
    scroll('ch-anchor-dimension', 'ch-target-dimension');
}

function initViewSelector() {
    const selector = document.getElementById('ch-viewer__selector');
    document.querySelectorAll('.ch-viewer__direction-item').forEach(function (el) {

        const selectorSize = window.innerWidth > 749 ? 96 : 70;
        el.onclick = function () {
            // const selectorSize = selector.getBoundingClientRect().width;
            const iconSize = el.getBoundingClientRect().width;

            const left = el.offsetLeft - (selectorSize - iconSize) * 0.5;
            selector.style.display = 'block';
            selector.style.transform = 'translate(' + left + 'px, 0)';

            if (el.classList.contains('ch-viewer__front')) {
                window.viewer && window.viewer.setCameraView('front');
            } else if (el.classList.contains('ch-viewer__top')) {
                window.viewer && window.viewer.setCameraView('top');
            } else if (el.classList.contains('ch-viewer__side')) {
                window.viewer && window.viewer.setCameraView('product');
            } else if (el.classList.contains('ch-viewer__left')) {
                window.viewer && window.viewer.setCameraView('left');
            }
        }
    })

    document.querySelector('.ch-viewer__sign').onclick = function () {
        selector.style.display = 'none';
        window.viewer && window.viewer.setAutoRotate(true);
    }
}

main();
