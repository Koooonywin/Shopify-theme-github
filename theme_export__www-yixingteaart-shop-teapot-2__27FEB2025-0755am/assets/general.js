/*
    © 2023 EcomGraduates.com
    https://www.ecomgraduates.com
*/

// Navbar megamenu - Open/close overlay
document.querySelectorAll('#navbar-desktop .dropdown-toggle').forEach(dropdown => {
    const init = () => {
        if (document.querySelector('#navbar-desktop .dropdown-menu.show')) {
            document.querySelector('#main').classList.add('main-hidden')
        } else {
            document.querySelector('#main').classList.remove('main-hidden')
        }
    }
    dropdown.addEventListener('shown.bs.dropdown', init)
    dropdown.addEventListener('hidden.bs.dropdown', init)
})

// Navbar megamenu - Hover trigger mode for parent menu items
document.querySelectorAll('#navbar-desktop.menu-desktop-hover .nav-item.dropdown').forEach(dropdown => {
    const bsDropdown = bootstrap.Dropdown.getOrCreateInstance(dropdown.querySelector('.nav-link'))

    dropdown.addEventListener('mouseover', () => {
        document.querySelectorAll('#navbar-desktop.menu-desktop-hover .dropdown-menu').forEach(menu => {
            if (menu.previousElementSibling.dataset.index !== dropdown.querySelector('.nav-link').dataset.index) {
                menu.classList.remove('show')
            }
        })
        bsDropdown.show()
    })

    dropdown.addEventListener('mouseleave', () => {
        setTimeout(() => {
            if (!dropdown.matches(':hover')) {
                bsDropdown.hide()
            }
        }, 200)
    })
})

// Quantity steppers (plus/minus)
window.onClickQtyPlusMinus = (btn) => {
    const input = btn.closest('.quantity-wrapper').querySelector('input')
    const inputValue = Number(input.value)

    if (btn.dataset.mode === 'plus') {
        input.value = inputValue + 1
    } else {
        if (input.value > Number(input.dataset.minQty)) {
            input.value = inputValue - 1
        }
    }

    const event = new Event('change')
    input.dispatchEvent(event)
}

// Share links using WebShare API
window.onLinkShare = (btn, e) => {
    if (navigator.share) {
        navigator.share({
            title: btn.dataset.shareTitle,
            url: window.location.href
        })
    } else {
        const popover = bootstrap.Popover.getOrCreateInstance(btn, {
            content: `
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control" value="${window.location.href}">
                    <button id="btn-share-copy" class="btn btn-outline-secondary" type="button">${btn.dataset.textCopy}</button>
                </div>
            `,
            html: true,
            sanitize: false,
            placement: 'top'
        })

        popover.show()

        document.querySelector('#btn-share-copy')?.addEventListener('click', (e) => {
            navigator.clipboard.writeText(window.location.href)
            e.target.textContent = btn.dataset.textCopied
        })

        setTimeout(() => {
            popover.hide()
            btn.blur()
        }, 4000)
    }
}

// Search page - set selected value for the types select field
const initSearchPageSetSelected = () => {
    const select = document.querySelector('#search-header .form-select')

    if (!select) return

    const params = new URLSearchParams(location.search)
    const type = params.get('type')

    if (!type) return

    select.value = type
}
initSearchPageSetSelected()

// Countdown timers
const initCountdownTimers = () => {
    document.querySelectorAll('.countdown-timer').forEach((elem) => {
        if (elem.classList.contains('init')) return

        elem.classList.add('init')

        let end = Number(elem.dataset.time) * 1000

        if (window.location.href.includes('ecomify')) {
            end = Date.now() + 1.08e+7
        }

        const seconds = 1000
        const minutes = seconds * 60
        const hours = minutes * 60

        const x = setInterval(() => {
            const now = new Date().getTime()
            const difference = end - now

            if (difference < 0) {
                clearInterval(x)
                elem.remove()
                return
            }

            elem.removeAttribute('hidden')

            const h = Math.floor((difference) / hours)
            const m = Math.floor((difference % hours) / minutes)
            const s = Math.floor((difference % minutes) / seconds)

            elem.querySelector('[data-hours').innerText = `${h}${elem.dataset.textH}`
            elem.querySelector('[data-hours').setAttribute('aria-label', `${h} ${elem.dataset.textHours}`)
            elem.querySelector('[data-minutes').innerText = `${m}${elem.dataset.textM}`
            elem.querySelector('[data-minutes').setAttribute('aria-label', `${m} ${elem.dataset.textMinutes}`)
            elem.querySelector('[data-seconds').innerText = `${s}${elem.dataset.textS}`
            elem.querySelector('[data-seconds').setAttribute('aria-label', `${s} ${elem.dataset.textSeconds}`)

            if (h === 0) {
                elem.querySelector('[data-hours').setAttribute('hidden', 'hidden')
            }
        }, seconds)
    })
}
initCountdownTimers()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('.countdown-timer')) {
        initCountdownTimers()
    }
})

// Shopify Official Reviews app
// https://apps.shopify.com/product-reviews
const initSprBadges = () => {
    window.SPR?.initDomEls()
    window.SPR?.loadBadges()
}
window.addEventListener('updated.ecomify.cart', initSprBadges)
window.addEventListener('updated.ecomify.collection', initSprBadges)

if (document.querySelector('#shopify-product-reviews')) {
    setInterval(() => {
        document.querySelector('.spr-summary-actions-newreview')
            .classList.add('btn', 'btn-secondary')

        document.querySelectorAll('input.spr-form-input').forEach(input => {
            input.classList.add('form-control')
        })

        document.querySelectorAll('textarea.spr-form-input').forEach(textarea => {
            textarea.classList.add('form-control')
        })
    }, 2000)
}

// Small fix for the demo megamenu/mobile-menu
// remove active classes
if (window.location.href.includes('ecomify')) {
    document.querySelectorAll('.dropdown-megamenu .dropdown-item.active').forEach(item => {
        item.classList.remove('active')
    })
    document.querySelectorAll('#offcanvas-menu .dropdown-item.active').forEach(item => {
        item.classList.remove('active')
    })
}

/*
    Prev/Next Articles in the Article view page
*/
const initPrevNextArticleButtons = async () => {
    const wrapper = document.querySelector('#article-prev-next')

    if (!wrapper) return

    await new Promise(resolve => setTimeout(resolve, 1000))

    const threshold = 600

    window.addEventListener('scroll', () => {
        if (window.scrollY > threshold) {
            wrapper.classList.add('show')
        } else {
            wrapper.classList.remove('show')
        }
    })
}
initPrevNextArticleButtons()
