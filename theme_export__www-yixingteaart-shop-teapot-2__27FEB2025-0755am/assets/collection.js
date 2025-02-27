/*
    © 2023 EcomGraduates.com
    https://www.ecomgraduates.com
*/

// Load collection elements dynamically (after ajax change)
const loadCollection = async () => {
    const productList = document.querySelector('.collection .product-list')

    if (productList) {
        productList.style.opacity = '.2'
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })

    const response = await fetch(window.location.href)
    const data = await response.text()
    const parser = new DOMParser()
    const newDocument = parser.parseFromString(data, 'text/html')

    document.querySelector('.collection')
        ?.replaceWith(newDocument.querySelector('.collection'))

    document.querySelectorAll('#offcanvas-filters .collapse-inner').forEach((collapse) => {
        const collapseId = collapse.closest('.collapse').getAttribute('id')
        collapse.replaceWith(newDocument.querySelector(`#offcanvas-filters #${collapseId} .collapse-inner`))
    })

    document.querySelector('#offcanvas-filters .offcanvas-footer')
        ?.replaceWith(newDocument.querySelector('#offcanvas-filters .offcanvas-footer'))

    document.querySelector('#offcanvas-filters .btn-filters-clear-all')
        ?.replaceWith(newDocument.querySelector('#offcanvas-filters .btn-filters-clear-all'))

    document.querySelector('#offcanvas-filters [name="sort_by"]')
        ?.replaceWith(newDocument.querySelector('#offcanvas-filters [name="sort_by"]'))

    document.querySelectorAll('.collection [data-bs-toggle="popover"]')
        .forEach((el) => bootstrap.Popover.getOrCreateInstance(el))

    const customEvent = new CustomEvent('updated.ecomify.collection')
    window.dispatchEvent(customEvent)
}

// Handle collection filters change events
window.onChangeCollectionFilter = async (input, event) => {
    const form = input.closest('form')
    const params = new URLSearchParams(new FormData(form))
    const url = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', url)

    await loadCollection()
}

// Handle collection price filters change
const initCollectionFiltersPriceChange = () => {
    document.querySelectorAll('.filter-price-group input').forEach(input => {
        input.addEventListener('input', window.debounce(async (event) => {
            const form = input.closest('form')
            const params = new URLSearchParams(new FormData(form))
            const url = `${window.location.pathname}?${params.toString()}`
            window.history.replaceState({}, '', url)

            await loadCollection()
        }, 750))
    })
}
initCollectionFiltersPriceChange()
window.addEventListener('updated.ecomify.collection', initCollectionFiltersPriceChange)

// 'View more' within collection filters
window.onClickFiltersViewMore = (btn, event) => {
    btn.closest('.collapse').querySelectorAll('.form-check').forEach((elem) => {
        elem.removeAttribute('hidden')
    })

    btn.remove()
}

// 'Clear all' within collection filters
window.onClickClearAllFilters = async (btn, event) => {
    const form = btn.closest('form')
    const params = new URLSearchParams()
    params.set('sort_by', form.querySelector('[name="sort_by"]').value)
    const url = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', url)

    await loadCollection()
}

// Sort-by select change event
window.onChangeCollectionSortBy = (value) => {
    const params = new URLSearchParams(window.location.search)
    params.set('sort_by', value)
    const url = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', url)

    loadCollection()
}

// Inifinite Pagination - on click "Load more" button
window.onClickCollectionLoadMore = async (btn, event) => {
    event.preventDefault()

    btn.style.width = `${btn.offsetWidth + 2}px`
    btn.style.height = `${btn.offsetHeight + 2}px`

    btn.innerHTML = `
        <div class="spinner-border spinner-border-sm mx-auto" role="status" style="width: 1.2rem; height: 1.2rem">
            <span class="visually-hidden">Loading...</span>
        </div>
    `

    window.history.replaceState({}, '', btn.dataset.nextUrl)

    const respoonse = await fetch(window.location.href)
    const data = await respoonse.text()
    const parser = new DOMParser()
    const newDocument = parser.parseFromString(data, 'text/html')

    document.querySelector('.collection .product-list')
        .insertAdjacentHTML('beforeend', newDocument.querySelector('.collection .product-list').innerHTML)

    document.querySelector('#collection-pagination')
        .replaceWith(newDocument.querySelector('#collection-pagination'))

    document.querySelectorAll('.collection [data-bs-toggle="popover"]')
        .forEach((el) => bootstrap.Popover.getOrCreateInstance(el))

    const customEvent = new CustomEvent('updated.ecomify.collection')
    window.dispatchEvent(customEvent)
}

// Inifinite Pagination - on click "Load previous" button
window.onClickCollectionLoadPrevious = async (btn, event) => {
    event.preventDefault()

    btn.style.width = `${btn.offsetWidth + 2}px`
    btn.style.height = `${btn.offsetHeight + 2}px`

    btn.innerHTML = `
        <div class="spinner-border spinner-border-sm mx-auto" role="status" style="width: 1.2rem; height: 1.2rem">
            <span class="visually-hidden">Loading...</span>
        </div>
    `

    window.history.replaceState({}, '', btn.dataset.previousUrl)

    const respoonse = await fetch(window.location.href)
    const data = await respoonse.text()
    const parser = new DOMParser()
    const newDocument = parser.parseFromString(data, 'text/html')

    document.querySelector('.collection .product-list')
        .insertAdjacentHTML('afterbegin', newDocument.querySelector('.collection .product-list').innerHTML)

    document.querySelector('#btn-load-previous')
        ?.replaceWith(newDocument.querySelector('#btn-load-previous'))

    document.querySelectorAll('.collection [data-bs-toggle="popover"]')
        .forEach((el) => bootstrap.Popover.getOrCreateInstance(el))

    const customEvent = new CustomEvent('updated.ecomify.collection')
    window.dispatchEvent(customEvent)
}

// Infinite Pagination - automatically load products on scroll
const initPaginationObserver = () => {
    const pagination = document.querySelector('#collection-pagination')

    if (!pagination) return

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const btn = pagination.querySelector('.btn-load-more')
                if (btn) btn.click()
            }
        })
    }, { threshold: 0, rootMargin: '0px 0px -100px 0px' })

    observer.observe(pagination)
}
initPaginationObserver()
window.addEventListener('updated.ecomify.collection', initPaginationObserver)

// Fixed utilities bar on Scroll
const fixedUtilitiesBarOnScroll = () => {
    const utilities = document.querySelector('#collection-utilities')

    if (!utilities) return

    const navbarHeight = document.querySelector('[id*="__navbar"].sticky-top')?.clientHeight || 0
    const announcementBarHeight = document.querySelector('[id*="__announcement-bar"].sticky-top')?.clientHeight || 0

    // const top = utilities.getBoundingClientRect().top
    const top = 700

    document.addEventListener('scroll', window.throttle(() => {
        if (window.scrollY > top) {
            utilities.classList.add('sticky-top')
            utilities.style.top = `${navbarHeight + announcementBarHeight}px`
            setTimeout(() => {
                utilities.classList.add('show')
            }, 200)
        } else {
            utilities.classList.remove('show')
            setTimeout(() => {
                utilities.classList.remove('sticky-top')
                utilities.style.top = '0'
            }, 200)
        }
    }, 200))

    setInterval(() => {
        if (window.scrollY < 50) {
            utilities.classList.remove('sticky-top')
            utilities.style.top = '0'
        }
    }, 1000)
}
fixedUtilitiesBarOnScroll()
window.addEventListener('updated.ecomify.collection', () => setTimeout(() => {
    fixedUtilitiesBarOnScroll()
}, 1000))

// 'Scroll top' button visibility
const handleScrollTopButton = () => {
    const btn = document.querySelector('#btn-collection-scroll-top')
    const productList = document.querySelector('.collection .product-list')

    if (!btn || !productList) return

    const top = productList.getBoundingClientRect().top

    document.addEventListener('scroll', window.throttle(() => {
        if (window.scrollY > top) {
            btn.classList.add('btn-show')
        } else {
            btn.classList.remove('btn-show')
        }
    }, 200))
}
handleScrollTopButton()
window.addEventListener('updated.ecomify.collection', handleScrollTopButton)

// Color swatches in product list items
window.showAllSwatchesWithinProductItem = (btn, event) => {
    const swatchesList = btn.closest('.color-swatches')
    swatchesList.querySelectorAll('li').forEach(elem => {
        elem.removeAttribute('hidden')
    })
    btn.remove()
}
