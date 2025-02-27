/*
    © 2023 EcomGraduates.com
    https://www.ecomgraduates.com
*/

/*
    Main 'Add to cart' (ATC) form
*/
window.onSubmitAtcForm = async (form, event) => {
    event.preventDefault()

    const btn = form.querySelector('.btn-atc')

    btn.innerHTML = `
        <div class="spinner-border spinner-border-sm" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    `

    form.classList.add('loading')

    const response = await fetch('/cart/add.js', { method: 'POST', body: new FormData(form) })

    form.classList.remove('loading')
    btn.innerHTML = window.theme.product.addedToCart

    setTimeout(() => {
        btn.innerHTML = btn.dataset.textAddToCart
    }, 2000)

    window.refreshCartContents(response)

    if (form.hasAttribute('data-ecomify-upsell-modal')) return
    if (btn.closest('.modal')) return

    if (document.querySelector('#offcanvas-cart')) {
        bootstrap.Offcanvas.getOrCreateInstance('#offcanvas-cart').show()
    }
}

/*
    'Add to cart' form based on variant
*/
window.onClickAtcFormVariant = async (btn, event) => {
    const form = btn.closest('form')
    form.querySelector('[name="id"]').value = btn.dataset.variantId

    window.onSubmitAtcForm(form, event)
}

/*
    Product options selector - Listen for change events
*/
window.onChangeProductOption = async (input) => {
    const selectedOptions = []

    input.closest('form').querySelectorAll('.product-option').forEach(elem => {
        if (elem.type === 'radio') {
            if (elem.checked) {
                selectedOptions.push(elem.value)
            }
        } else {
            selectedOptions.push(elem.value)
        }
    })

    const selectedVariant = window.productVariants.find(variant =>
        JSON.stringify(variant.options) === JSON.stringify(selectedOptions)
    )

    console.log(selectedVariant)

    const btn = input.closest('form').querySelector('.btn-atc')

    if (selectedVariant) {
        input.closest('form').querySelector('[name="id"]').value = selectedVariant.id

        if (selectedVariant.available) {
            btn.disabled = false
            btn.innerHTML = window.theme.product.addToCart
        } else {
            btn.disabled = true
            btn.innerHTML = window.theme.product.soldOut
        }

        if (selectedVariant.compare_at_price) {
            input.closest('.product-content').querySelector('.product-price').innerHTML = `
                <span class="product-price-compare text-muted me-3">
                    <span class="visually-hidden">
                        ${window.theme.product.priceFrom} &nbsp;
                    </span>
                    <s>
                        ${Shopify.formatMoney(selectedVariant.compare_at_price)}
                    </s>
                </span>
                <span class="product-price-final">
                    <span class="visually-hidden">
                        ${window.theme.product.priceSale} &nbsp;
                    </span>
                    ${Shopify.formatMoney(selectedVariant.price)}
                </span>
            `
        } else {
            input.closest('.product-content').querySelector('.product-price').innerHTML = `
                <span class="product-price-final">
                    ${Shopify.formatMoney(selectedVariant.price)}
                </span>
            `
        }
        if (selectedVariant.available && selectedVariant.compare_at_price) {
            input.closest('.product-content').querySelector('.product-price').insertAdjacentHTML('beforeend', `
                <span class="price-badge-sale badge">
                    ${window.theme.product.save}: ${Math.round((1 - (selectedVariant.price / selectedVariant.compare_at_price)) * 100)}%
                </span>    
            `)
        } else if (!selectedVariant.available) {
            input.closest('.product-content').querySelector('.product-price').insertAdjacentHTML('beforeend', `
                <span class="price-badge-sold-out badge">
                    ${window.theme.product.soldOut}
                </span>
            `)
        }

        const purchaseOptionsWrapper = document.querySelector('#product-purchase-options')

        if (purchaseOptionsWrapper) {
            purchaseOptionsWrapper.querySelector('input#purchase-options-one-time + label [data-price]').textContent = Shopify.formatMoney(selectedVariant.price)
            purchaseOptionsWrapper.querySelector('input#purchase-options-subscription + label [data-price]').textContent = Shopify.formatMoney(selectedVariant.selling_plan_allocations[0].price)
        }

        const skuWrapper = input.closest('.product-content').querySelector('.current-variant-sku')

        if (skuWrapper) {
            if (selectedVariant.sku.length) {
                skuWrapper.textContent = selectedVariant.sku
                skuWrapper.removeAttribute('hidden')
            } else {
                skuWrapper.setAttribute('hidden', 'hidden')
            }
        }

        if (input.closest('#product-template')) {
            const url = new URL(window.location)
            url.searchParams.set('variant', selectedVariant.id)
            window.history.replaceState({}, '', url)
        }

        const customEvent = new CustomEvent('variantChange.ecomify.product', {
            detail: selectedVariant
        })
        window.dispatchEvent(customEvent)
    } else {
        btn.disabled = true
        btn.innerHTML = window.theme.product.unavailable
    }

    if (input.closest('.color-swatches')) {
        input.closest('.product-option-wrapper').querySelector('.color-swatches-title span')
            .textContent = input.value
    }

    if (input.closest('.size-buttons')) {
        input.closest('.product-option-wrapper').querySelector('.size-buttons-title span')
            .textContent = input.value
    }
}

/*
    Update various elements on variant change that need a new document fetch
*/
window.addEventListener('variantChange.ecomify.product', async (event) => {
    const inventoryBar = document.querySelector('#inventory-bar')

    if (inventoryBar) {
        inventoryBar.style.opacity = '.25'
    }

    const respoonse = await fetch(window.location.href)
    const text = await respoonse.text()
    const newDocument = new DOMParser().parseFromString(text, 'text/html')

    document.querySelector('#inventory-bar')
        ?.replaceWith(newDocument.querySelector('#inventory-bar'))
    document.querySelector('#product-qty-breaks')
        ?.replaceWith(newDocument.querySelector('#product-qty-breaks'))

    document.querySelector('#product-store-availability-wrapper')
        ?.replaceWith(newDocument.querySelector('#product-store-availability-wrapper'))

    initQtyBreaks()
})

/*
    Purchase options (selling/subscription plans)
*/
const initPurchaseOptions = () => {
    const wrapper = document.querySelector('#product-purchase-options')

    if (!wrapper) return

    wrapper.querySelectorAll('[name="purchase_option"]').forEach(input => {
        input.addEventListener('change', () => {
            if (input.id === 'purchase-options-one-time') {
                wrapper.querySelector('#purchase-delivery-options').setAttribute('hidden', 'hidden')
                wrapper.querySelector('[name="selling_plan"]').disabled = true
            } else {
                wrapper.querySelector('#purchase-delivery-options').removeAttribute('hidden')
                wrapper.querySelector('[name="selling_plan"]').disabled = false
            }
        })
    })
}
initPurchaseOptions()

// Product Item - Handle variant change
window.onChangeProductItemVariant = (select, event) => {
    if (select.options[select.selectedIndex].dataset.variantImage?.length) {
        select.closest('.product-item').querySelector('.product-item-img').src =
            select.options[select.selectedIndex].dataset.variantImage
    }

    const compareAtPrice = select.options[select.selectedIndex].dataset.compareAtPrice
    const price = select.options[select.selectedIndex].dataset.price

    if (compareAtPrice.length) {
        select.closest('.product-item').querySelector('.product-item-price').innerHTML = `
            <span class="product-item-price-compare text-muted me-1">
                <span class="visually-hidden">
                    ${window.theme.product.priceFrom} &nbsp;
                </span>
                <s>
                    ${Shopify.formatMoney(compareAtPrice)}
                </s>
            </span>
            <span class="product-item-price-final">
                <span class="visually-hidden">
                    ${window.theme.product.priceSale} &nbsp;
                </span>
                ${Shopify.formatMoney(price)}
            </span>
        `
    } else {
        select.closest('.product-item').querySelector('.product-item-price').innerHTML = `
            <span class="product-item-price-final">
                ${Shopify.formatMoney(price)}
            </span>
        `
    }
}

/*
    'Buy it now' button
*/
window.onClickBuyBtn = (btn) => {
    btn.innerHTML = `
        <div class="spinner-border spinner-border-sm" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    `
    const form = btn.closest('form')
    const variantId = form.querySelector('[name="id"]').value
    const qty = Number(form.querySelector('input[name="quantity"]')?.value || 1)
    window.location.href = `/cart/${variantId}:${qty}`
}

/*
    Product Gallery
*/
const initProductGallery = () => {
    document.querySelectorAll('.product-gallery:not(.init)').forEach(gallery => {
        gallery.classList.add('init')

        const main = new Splide(gallery.querySelector('.main-splide'), {
            start: Number(gallery.dataset.start),
            rewind: true,
            arrows: false,
            rewindByDrag: true,
            pagination: false,
            noDrag: 'model-viewer',
            mediaQuery: 'min',
            breakpoints: {
                0: { padding: { right: gallery.dataset.showThumbsMobile === 'false' ? '4rem' : 0 } },
                992: { padding: 0 }
            },
            direction: document.documentElement.getAttribute('dir')
        })

        const totalSlides = gallery.querySelectorAll('.main-splide .splide__slide').length

        const thumbs = new Splide(gallery.querySelector('.thumbs-splide'), {
            start: Number(gallery.dataset.start),
            gap: '.5rem',
            rewind: true,
            rewindByDrag: true,
            pagination: false,
            isNavigation: true,
            focus: totalSlides > 5 ? 'center' : 0,
            mediaQuery: 'min',
            breakpoints: {
                0: { perPage: 5, arrows: true },
                576: { perPage: 5, arrows: true },
                768: { perPage: 5, arrows: true },
                992: { perPage: 5, arrows: true },
                1200: { perPage: 5, arrows: true },
                1400: { perPage: 5, arrows: true }
            },
            direction: document.documentElement.getAttribute('dir')
        })

        main.on('move', (newIndex, prevIndex) => {
            const iframe = gallery.querySelector(`.splide__slide:nth-child(${prevIndex + 1}) iframe`)
            const video = gallery.querySelector(`.splide__slide:nth-child(${prevIndex + 1}) video`)
            if (iframe) {
                // eslint-disable-next-line no-self-assign
                iframe.src = iframe.src
            }
            if (video) {
                video.pause()
            }
        })

        window.addEventListener('variantChange.ecomify.product', (event) => {
            const selectedVariant = event.detail

            if (selectedVariant.featured_media) {
                main.go(selectedVariant.featured_media.position - 1)
            }
        }, false)

        main.sync(thumbs)
        main.mount()
        thumbs.mount()

        if (window.matchMedia('(min-width: 992px)').matches) {
            const navbarHeight = document.querySelector('[id*="__navbar"].sticky-top')?.clientHeight || 0
            const announcementBarHeight = document.querySelector('[id*="__announcement-bar"].sticky-top')?.clientHeight || 0
            gallery.style.position = 'sticky'
            gallery.style.top = `${navbarHeight + announcementBarHeight + 20}px`
            gallery.style.zIndex = '1'
        }

        if (window.GLightbox) {
            // eslint-disable-next-line no-unused-vars
            const lightbox = GLightbox({
                selector: `[data-gallery="product-gallery-${gallery.dataset.productId}"]`,
                videosWidth: '1290px',
                loop: true
            })
            lightbox.on('slide_changed', ({ prev, current }) => {
                main.go(current.index)
            })
        }

        const modelViewer = gallery.querySelector('model-viewer')

        if (modelViewer) {
            const increaseBtn = gallery.querySelector('[data-model-3d-increase-zoom]')
            const decreaseBtn = gallery.querySelector('[data-model-3d-decrease-zoom]')
            const fullscreenBtn = gallery.querySelector('[data-model-3d-fullscreen]')

            increaseBtn.addEventListener('click', () => {
                modelViewer.zoom(1)
            })

            decreaseBtn.addEventListener('click', () => {
                modelViewer.zoom(-1)
            })

            fullscreenBtn.addEventListener('click', () => {
                if (document.fullscreenElement) {
                    document.exitFullscreen()
                    fullscreenBtn.querySelector('.bi-fullscreen').removeAttribute('hidden')
                    fullscreenBtn.querySelector('.bi-fullscreen-exit').setAttribute('hidden', 'hidden')
                } else {
                    modelViewer.closest('.product-gallery-model-3d').requestFullscreen()
                    fullscreenBtn.querySelector('.bi-fullscreen').setAttribute('hidden', 'hidden')
                    fullscreenBtn.querySelector('.bi-fullscreen-exit').removeAttribute('hidden')
                }
            })
        }
    })
}
initProductGallery()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('.product-gallery')) {
        initProductGallery()
    }
})

window.addEventListener('updated.ecomify.collection', initProductGallery)

/*
    Personalization (Custom properties)
*/
const initPersonalization = () => {
    document.querySelectorAll('.product-personalization-field[data-type="checkbox"]').forEach(elem => {
        let values = []

        elem.querySelectorAll('input').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    values.push(checkbox.value)
                } else {
                    values = values.filter((item) => item !== checkbox.value)
                }

                elem.querySelector('[type="hidden"]').value = values.join(', ')
            })
        })
    })
}
initPersonalization()

/*
    Qty Breaks
*/
const initQtyBreaks = () => {
    document.querySelectorAll('[name="product-qty-breaks"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const qty = Number(radio.dataset.qty)

            const qtyField = radio.closest('.product-content').querySelector('[name="quantity"]')
            const btn = radio.closest('.product-content').querySelector('button[name="add"]')

            if (!qtyField) return

            qtyField.value = qty

            setTimeout(() => {
                btn.classList.add('animate__animated', 'animate__shakeX')
            }, 250)

            setTimeout(() => {
                btn.classList.remove('animate__animated', 'animate__shakeX')
            }, 1500)
        })
    })
}
initQtyBreaks()
