/*
    © 2023 EcomGraduates.com
    https://www.ecomgraduates.com
*/

// Refresh cart contents (offcanvas cart, cart page, count badges, etc)
window.refreshCartContents = async (response) => {
    console.log(response)

    const offcanvasCart = document.querySelector('#offcanvas-cart')
    const cartPage = document.querySelector('#cart')

    offcanvasCart?.classList.add('loading')
    cartPage?.classList.add('loading')

    const newResponse = await fetch(window.location.href)
    const text = await newResponse.text()
    const newDocument = new DOMParser().parseFromString(text, 'text/html')

    offcanvasCart?.querySelector('.offcanvas-body')
        .replaceWith(newDocument.querySelector('#offcanvas-cart .offcanvas-body'))
    offcanvasCart?.querySelector('.offcanvas-footer')
        .replaceWith(newDocument.querySelector('#offcanvas-cart .offcanvas-footer'))
    cartPage?.replaceWith(newDocument.querySelector('#cart'))

    document.querySelectorAll('.cart-count-badge').forEach((badge) => {
        badge.textContent = newDocument.querySelector('.cart-count-badge').textContent
        badge.removeAttribute('hidden')
    })

    offcanvasCart?.classList.remove('loading')
    cartPage?.classList.remove('loading')

    window.dispatchEvent(new Event('updated.ecomify.cart'))

    if (response.ok) {
        if (response.url.includes('add.js')) {
            offcanvasCart?.querySelector('#offcanvas-cart-alert-add').removeAttribute('hidden')

            const data = await response.json()

            if (data.items?.length > 1) {
                const elemAlertItemsAdded = offcanvasCart?.querySelector('#offcanvas-cart-alert-add [data-alert-items-added]')

                elemAlertItemsAdded.textContent = elemAlertItemsAdded.textContent.replace('[count]', data.items.length)
                elemAlertItemsAdded.removeAttribute('hidden')
            } else {
                offcanvasCart?.querySelector('#offcanvas-cart-alert-add [data-alert-item-added]')
                    .removeAttribute('hidden')
            }
        } else {
            offcanvasCart?.querySelector('#offcanvas-cart-alert-updated').removeAttribute('hidden')
        }
    } else {
        const data = await response.json()
        const alert = document.querySelector('#offcanvas-cart-alert-error')
        alert.querySelector('span').textContent = `${data.message} - ${data.description}`
        alert.removeAttribute('hidden')
    }

    if (offcanvasCart?.querySelector('#offcanvas-cart-empty')) {
        setTimeout(() => {
            bootstrap.Offcanvas.getOrCreateInstance(offcanvasCart).hide()
        }, 1000)
    }
}

// Quantity Inputs
window.onChangeCartQty = async (input) => {
    const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: input.dataset.lineItemKey,
            quantity: input.value
        })
    })
    window.refreshCartContents(response)
}

// Remove Buttons
window.onRemoveCartItem = async (btn) => {
    const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: btn.dataset.lineItemKey,
            quantity: 0
        })
    })
    window.refreshCartContents(response)
}

// Cart note - Save note via ajax
window.onSaveCartNote = async (btn) => {
    btn.innerHTML = `
        <div class="spinner-border spinner-border-sm" role="status" style="width: 1rem; height: 1rem">
            <span class="visually-hidden">Loading...</span>
        </div>
    `

    const note = btn.closest('#cart-note').querySelector('[name="note"]').value

    await fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
    })

    btn.innerHTML = `✓ <span class="visually-hidden">${btn.dataset.textNoteSaved}</span>`

    setTimeout(() => {
        btn.innerHTML = btn.dataset.textBtnSave
    }, 4000)
}

// Checkout button - indicate loading on click
window.onClickCheckoutBtn = (btn) => {
    btn.style.height = btn.clientHeight + 'px'
    btn.innerHTML = `
        <div class="spinner-border spinner-border-sm" role="status" style="width: 1.2rem; height: 1.2rem">
            <span class="visually-hidden">Loading...</span>
        </div>
    `
}

// Cart Goal - Animate width
const initCartGoal = () => {
    const progressBar = document.querySelector('#cart-goal .progress-bar')
    if (progressBar) {
        setTimeout(() => {
            progressBar.style.width = progressBar.dataset.width
        }, 250)
    }
}
initCartGoal()

window.addEventListener('updated.ecomify.cart', () => {
    initCartGoal()
})

// Summary card on the cart page - sticky on desktop
const initStickySummaryCard = () => {
    const card = document.querySelector('#cart-summary')

    if (!card) return

    if (window.matchMedia('max-width: 991px').matches) return

    const navbarHeight = document.querySelector('[id*="__navbar"].sticky-top')?.clientHeight || 0
    const announcementBarHeight = document.querySelector('[id*="__announcement-bar"].sticky-top')?.clientHeight || 0

    card.style.position = 'sticky'
    card.style.top = `${navbarHeight + announcementBarHeight + 20}px`
}
initStickySummaryCard()

window.addEventListener('updated.ecomify.cart', () => {
    initStickySummaryCard()
})

// Generate Shipping rates
// https://shopify.dev/docs/api/ajax/reference/cart#generate-shipping-rates
window.generateShippingRates = async (btn) => {
    btn.innerHTML = `
        <div class="spinner-border spinner-border-sm" role="status" style="width: 1rem; height: 1rem">
            <span class="visually-hidden">Loading...</span>
        </div>
    `

    const wrapper = document.querySelector('#cart-shipping-rates-collapse')

    wrapper.querySelector('#shipping-rates-modal-alert-danger').innerHTML = ''
    wrapper.querySelector('#shipping-rates-modal-alert-danger').setAttribute('hidden', 'hidden')
    wrapper.querySelector('#shipping-rates-modal-alert-warning').innerHTML = ''
    wrapper.querySelector('#shipping-rates-modal-alert-warning').setAttribute('hidden', 'hidden')
    wrapper.querySelector('#shipping-rates-modal-alert-success').innerHTML = ''
    wrapper.querySelector('#shipping-rates-modal-alert-success').setAttribute('hidden', 'hidden')

    const country = wrapper.querySelector('#shipping-rates-modal-country').value
    const province = wrapper.querySelector('#shipping-rates-modal-province').value
    const zip = wrapper.querySelector('#shipping-rates-modal-zip').value

    const prepareResponse = await fetch(`/cart/prepare_shipping_rates.json?shipping_address[zip]=${zip}&shipping_address[country]=${country}&shipping_address[province]=${province}`, {
        method: 'POST'
    })
    console.log(prepareResponse)

    if (prepareResponse.ok) {
        const asyncRespose = await fetch(`/cart/async_shipping_rates.json?shipping_address[zip]=${zip}&shipping_address[country]=${country}&shipping_address[province]=${province}`)
        console.log(asyncRespose)

        const data = await asyncRespose.json()
        console.log(data)

        let html = ''

        if (data.shipping_rates.length) {
            data.shipping_rates.forEach(elem => {
                html += `
                    <li>
                        <strong>${elem.presentment_name}</strong>: ${elem.price} ${elem.currency}
                    </li>
                `
            })

            wrapper.querySelector('#shipping-rates-modal-alert-success').innerHTML = `
                <ul class="ps-5 mb-0">
                    ${html}
                </ul>
            `
            wrapper.querySelector('#shipping-rates-modal-alert-success').removeAttribute('hidden')
        } else {
            wrapper.querySelector('#shipping-rates-modal-alert-warning').innerHTML = `
                <p class="mb-0">
                    ${wrapper.dataset.textNoResults}
                </p>
            `
            wrapper.querySelector('#shipping-rates-modal-alert-warning').removeAttribute('hidden')
        }
    } else {
        const data = await prepareResponse.json()
        console.log(data)

        let html = ''

        for (const [key, value] of Object.entries(data)) {
            html += `
                <li>
                    <strong>${key}</strong>: ${value.toString()}
                </li>
            `
        }

        wrapper.querySelector('#shipping-rates-modal-alert-danger').innerHTML = `
            <ul class="ps-5 mb-0">
                ${html}
            </ul>
        `
        wrapper.querySelector('#shipping-rates-modal-alert-danger').removeAttribute('hidden')
    }

    btn.innerHTML = btn.dataset.text
}

// Offcanvas cart - fix scrolling for callapses
const fixScrollingOffcanvasCollapses = () => {
    document.querySelectorAll('#offcanvas-cart [data-bs-toggle="collapse"]').forEach(elem => {
        elem.addEventListener('click', () => {
            setTimeout(() => {
                const offcanvasBody = document.querySelector('#offcanvas-cart .offcanvas-body')
                offcanvasBody.scroll({ top: offcanvasBody.scrollHeight, behavior: 'smooth' })
            }, 250)
        })
    })
}
fixScrollingOffcanvasCollapses()

window.addEventListener('updated.ecomify.cart', () => {
    fixScrollingOffcanvasCollapses()
})
