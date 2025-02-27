/*
    © 2023 EcomGraduates.com
    https://www.ecomgraduates.com
*/

/*
    Announcement bar
*/
const initStickyAnnouncementBar = () => {
    const section = document.querySelector('.announcement-bar-sticky')
    if (!section) return

    section.closest('.shopify-section').classList.add('sticky-top')

    const navbar = document.querySelector('[id*="__navbar"].sticky-top')
    if (!navbar) return

    navbar.style.top = document.querySelector('.announcement-bar-sticky').clientHeight + 'px'
}
initStickyAnnouncementBar()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('.announcement-bar-sticky')) {
        initStickyAnnouncementBar()
    }
})

document.addEventListener('shopify:block:select', (event) => {
    const carousel = event.target.closest('.announcement-bar .carousel')

    if (carousel) {
        bootstrap.Carousel.getOrCreateInstance(carousel, { ride: false })
            .to(event.target.dataset.index)
    }
})

/*
    Carousel
*/
document.addEventListener('shopify:block:select', (event) => {
    const carousel = event.target.closest('.carousel')

    if (carousel) {
        bootstrap.Carousel.getOrCreateInstance(carousel, { ride: false })
            .to(event.target.dataset.index)
    }
})

/*
    Marquee
*/
const initMarqueeSections = () => {
    document.querySelectorAll('.marquee').forEach(section => {
        const list = section.querySelector('ul')
        const marqueeWidth = list.scrollWidth
        const marqueeLength = list.querySelectorAll('li').length

        list.insertAdjacentHTML('beforeEnd', list.innerHTML)
        list.insertAdjacentHTML('beforeEnd', list.innerHTML)

        list.querySelectorAll('li').forEach((item, index) => {
            if (index >= marqueeLength) {
                item.setAttribute('aria-hidden', 'true')
            }
        })

        let translateX = `-${marqueeWidth}`

        if (document.documentElement.getAttribute('dir') === 'rtl') {
            translateX = `${marqueeWidth}`
        }

        let style = `
            <style>
                #marquee-${list.dataset.sectionId} ul {
                    animation-name: marquee-animation-${list.dataset.sectionId};
                    animation-duration: ${list.dataset.animationDuration}s;
                }
                @keyframes marquee-animation-${list.dataset.sectionId} {
                    to { transform: translateX(${translateX}px); }
                }
            </style>
        `
        if (list.dataset.marqueeDirection === 'right') {
            style += `
                <style>
                    @keyframes marquee-animation-${list.dataset.sectionId} {
                        from { transform: translateX(${translateX}px); }    
                        to { transform: 0); }    
                    }
                </style>
            `
        }

        list.insertAdjacentHTML('beforeBegin', style)
    })
}
initMarqueeSections()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('.marquee')) {
        initMarqueeSections()
    }
})

/*
    Featured Products
*/
const initFeaturedProducts = () => {
    document.querySelectorAll('.featured-products:not(.init)').forEach(section => {
        section.classList.add('init')

        const element = section.querySelector('.splide')

        if (!element) {
            return
        }

        const mySplide = new Splide(element, {
            arrows: element.dataset.arrows === 'true',
            pagination: element.dataset.pagination === 'true',
            easing: element.dataset.easing,
            speed: Number(element.dataset.speed),
            perMove: Number(element.dataset.perMove),
            autoplay: element.dataset.autoplay === 'true',
            interval: Number(element.dataset.interval),
            per_move: Number(element.dataset.perMove),
            rewind: element.dataset.rewind === 'true',
            mediaQuery: 'min',
            breakpoints: {
                0: { perPage: Number(element.dataset.breakpointXs), padding: 0 },
                576: { perPage: Number(element.dataset.breakpointSm), padding: 0 },
                768: { perPage: Number(element.dataset.breakpointMd), padding: 0 },
                992: { perPage: Number(element.dataset.breakpointLg), padding: 0 },
                1200: { perPage: Number(element.dataset.breakpointXl), padding: 0 },
                1400: { perPage: Number(element.dataset.breakpointXxl), padding: 0 }
            },
            direction: document.documentElement.getAttribute('dir')
        })

        const fixArrowsPos = () => {
            const top = section.querySelector('.product-item-img')?.clientHeight / 2
            section.querySelectorAll('.splide__arrow').forEach(arrow => {
                arrow.style.top = `${top}px`
            })
        }

        const fixPagination = () => {
            if (window.matchMedia('(max-width: 575px').matches) {
                const pagination = section.querySelector('.splide__pagination')

                if (!pagination) return

                section.querySelector('.splide__pagination--mobile')?.remove()

                const total = pagination.querySelectorAll('button').length

                let text = element.dataset.textSlideOf.replace('[x]', mySplide.index + 1)
                text = text.replace('[total]', total)

                pagination.insertAdjacentHTML('beforebegin', `
                    <div class="splide__pagination--mobile text-muted small">
                        ${text}
                    </div>
                `)
            }
        }

        mySplide.on('ready resize', () => {
            fixArrowsPos()
            fixPagination()
        })

        mySplide.on('move', () => {
            fixPagination()
        })

        mySplide.mount()
    })
}
initFeaturedProducts()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('.featured-products')) {
        initFeaturedProducts()
    }
})

/*
    Recommended Products
    https://shopify.dev/themes/product-merchandising/recommendations
*/
const initRecommendedProducts = async () => {
    const section = document.querySelector('.recommended-products')

    if (!section) return

    const { sectionId, baseUrl, productId, limit, intent } = section.dataset
    const url = `${baseUrl}?section_id=${sectionId}&product_id=${productId}&limit=${limit}&intent=${intent}`
    const response = await fetch(url)
    const data = await response.text()

    section.closest('.shopify-section').outerHTML = data

    document.querySelectorAll('.recommended-products [data-bs-toggle="popover"]')
        .forEach((el) => bootstrap.Popover.getOrCreateInstance(el))

    initFeaturedProducts()

    const customEvent = new CustomEvent('init.ecomify.recommended_products')
    window.dispatchEvent(customEvent)
}
initRecommendedProducts()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('.recommended-products')) {
        initRecommendedProducts()
    }
})

/*
    Testimonials
*/
const initTestimonials = () => {
    document.querySelectorAll('.testimonials').forEach(section => {
        const element = section.querySelector('.splide')

        const mySplide = new Splide(element, {
            type: element.dataset.loop === 'true' ? 'loop' : 'slide',
            arrows: element.dataset.arrows === 'true',
            pagination: element.dataset.pagination === 'true',
            easing: element.dataset.easing,
            speed: Number(element.dataset.speed),
            perMove: Number(element.dataset.perMove),
            autoplay: element.dataset.autoplay === 'true',
            interval: Number(element.dataset.interval),
            per_move: Number(element.dataset.perMove),
            rewind: element.dataset.rewind === 'true',
            mediaQuery: 'min',
            breakpoints: {
                0: { perPage: Number(element.dataset.breakpointXs), padding: '10%' },
                576: { perPage: Number(element.dataset.breakpointSm), padding: 0 },
                768: { perPage: Number(element.dataset.breakpointMd), padding: 0 },
                992: { perPage: Number(element.dataset.breakpointLg), padding: 0 },
                1200: { perPage: Number(element.dataset.breakpointXl), padding: 0 },
                1400: { perPage: Number(element.dataset.breakpointXxl), padding: 0 }
            },
            direction: document.documentElement.getAttribute('dir')
        })

        const fixArrowsPos = () => {
            const top = section.querySelector('.card').clientHeight / 2
            section.querySelectorAll('.splide__arrow').forEach(arrow => {
                arrow.style.top = `${top}px`
            })
        }

        const fixPagination = () => {
            if (window.matchMedia('(max-width: 575px').matches) {
                const pagination = section.querySelector('.splide__pagination')

                if (!pagination) return

                section.querySelector('.splide__pagination--mobile')?.remove()

                const total = pagination.querySelectorAll('button').length

                let text = element.dataset.textSlideOf.replace('[x]', mySplide.index + 1)
                text = text.replace('[total]', total)

                pagination.insertAdjacentHTML('beforebegin', `
                    <div class="splide__pagination--mobile text-muted small">
                        ${text}
                    </div>
                `)
            }
        }

        mySplide.on('ready resize', () => {
            fixArrowsPos()
            fixPagination()
        })

        mySplide.on('move', () => {
            fixPagination()
        })

        mySplide.mount()
    })
}
initTestimonials()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('.testimonials')) {
        initTestimonials()
    }
})

/*
    Parallax image
*/
const initParallaxImage = () => {
    document.querySelectorAll('.parallax-image').forEach(async (section, index) => {
        if (index === 0) {
            const vendorScript = document.createElement('script')
            vendorScript.src = section.dataset.vendorScript
            document.head.appendChild(vendorScript)

            await new Promise(resolve => setTimeout(resolve, 1000))
        }

        const imgMobile = section.querySelector('.img-mobile')
        const imgDesktop = section.querySelector('.img-desktop')

        // eslint-disable-next-line new-cap, no-new
        new simpleParallax(imgMobile, {
            orientation: imgMobile.dataset.orientation,
            scale: Number(imgMobile.dataset.scale / 100)
            // maxTransition: 80
        })

        // eslint-disable-next-line new-cap, no-new
        new simpleParallax(imgDesktop, {
            orientation: imgDesktop.dataset.orientation,
            scale: Number(imgDesktop.dataset.scale / 100)
        })
    })
}
initParallaxImage()

document.addEventListener('shopify:section:load', (e) => {
    if (e.target.querySelector('.parallax-image')) {
        initParallaxImage()
    }
})
