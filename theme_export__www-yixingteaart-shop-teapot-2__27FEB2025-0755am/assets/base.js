/*
    © 2023 EcomGraduates.com
    https://www.ecomgraduates.com
*/

console.log('Ecomify Lite Theme - Shopify Theme by EcomGraduates.com | Learn more at https://www.ecomgraduates.com')

// Init Bootstrap tooltips
document.querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => new bootstrap.Tooltip(el))

// Init Bootstrap popovers
document.querySelectorAll('[data-bs-toggle="popover"]')
    .forEach((el) => new bootstrap.Popover(el))

// Shopify's callenge page - Add BS classes
document.querySelector('.btn.shopify-challenge__button')
    ?.classList.add('btn-primary')

// Shopify's errors messages - Add BS classes
const errors = document.querySelector('.errors')
if (errors) {
    errors.classList.add('alert', 'alert-danger')
}

// Shopify's money format
Shopify.formatMoney = function (cents, format) {
    if (typeof cents === 'string') {
        cents = cents.replace('.', '')
    }

    let value = ''
    const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/
    const formatString = (format || this.money_format)

    function defaultOption (opt, def) {
        return (typeof opt === 'undefined' ? def : opt)
    }

    function formatWithDelimiters (number, precision, thousands, decimal) {
        precision = defaultOption(precision, 2)
        thousands = defaultOption(thousands, ',')
        decimal = defaultOption(decimal, '.')

        if (isNaN(number) || number == null) {
            return 0
        }

        number = (number / 100.0).toFixed(precision)

        const parts = number.split('.')
        const dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands)
        const cents = parts[1] ? (decimal + parts[1]) : ''

        return dollars + cents
    }

    switch (formatString.match(placeholderRegex)[1]) {
    case 'amount':
        value = formatWithDelimiters(cents, 2)
        break
    case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0)
        break
    case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',')
        break
    case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',')
        break
    }

    return formatString.replace(placeholderRegex, value)
}

// Resize Shopify images - helper function
// https://gist.github.com/DanWebb/cce6ab34dd521fcac6ba
Shopify.resizeImage = (src, size, crop = '') => src.replace(/_(pico|icon|thumb|small|compact|medium|large|grande|original|1024x1024|2048x2048|master)+\./g, '.')
    .replace(/\.jpg|\.png|\.gif|\.jpeg/g, (match) => {
        if (crop.length) {
            // eslint-disable-next-line no-param-reassign
            crop = `_crop_${crop}`
        }
        return `_${size}${crop}${match}`
    })

// Debounce - helper function
window.debounce = (callback, wait = 200) => {
    let timeout
    return (...args) => {
        const context = this
        clearTimeout(timeout)
        timeout = setTimeout(() => callback.apply(context, args), wait)
    }
}

// Throttle - helper function
window.throttle = (callback, timeFrame = 200) => {
    let lastTime = 0
    return function () {
        const now = Date.now()
        if (now - lastTime >= timeFrame) {
            callback()
            lastTime = now
        }
    }
}

// Create cookie - helper function
window.createCookie = (name, value, days) => {
    let date, expires
    if (days) {
        date = new Date()
        date.setDate(date.getDate() + days)
        expires = '; expires=' + date.toUTCString()
    } else {
        expires = ''
    }
    document.cookie = name + '=' + value + expires + '; path=/'
}

// Detect elements when they are within view
// https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
const initEnterView = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('entered')

                entry.target.querySelectorAll('.animate__animated.opacity-0').forEach((el) => {
                    el.classList.remove('opacity-0')
                    el.classList.add(el.dataset.animateClass)
                })
            }
        })
    }, { threshold: 0, rootMargin: '0px 0px -200px 0px' })

    document.querySelectorAll('.enter-view').forEach((el) => {
        observer.observe(el)
    })
}
initEnterView()

// Lazy load HTMl5 videos
// https://web.dev/lazy-loading-video/
const initVideoLazyLoad = () => {
    const lazyVideos = [].slice.call(document.querySelectorAll('video.lazy-video'))

    if ('IntersectionObserver' in window) {
        const lazyVideoObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (video) {
                if (video.isIntersecting) {
                    for (const source in video.target.children) {
                        const videoSource = video.target.children[source]
                        if (typeof videoSource.tagName === 'string' && videoSource.tagName === 'SOURCE') {
                            videoSource.src = videoSource.dataset.src
                        }
                    }

                    video.target.load()

                    if (video.target.hasAttribute('data-poster')) {
                        video.target.poster = video.target.dataset.poster
                    }

                    video.target.classList.remove('lazy-video')
                    lazyVideoObserver.unobserve(video.target)
                }
            })
        }, { threshold: 0, rootMargin: '0px 0px 200px 0px' })

        lazyVideos.forEach(function (lazyVideo) {
            lazyVideoObserver.observe(lazyVideo)
        })
    }
}
initVideoLazyLoad()

document.addEventListener('shopify:section:load', () => {
    document.querySelectorAll('.enter-view').forEach((elem) => {
        elem.classList.add('entered')
        document.querySelectorAll('.animate__animated.opacity-0').forEach((el) => {
            el.classList.remove('opacity-0')
        })
    })
})
