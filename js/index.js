let APP = {}
// APP UTILS =======================================================================
APP.utils = {
   debounce: (func, delay) => {
      let timeoutId
      return function (...args) {
         const context = this
         clearTimeout(timeoutId)
         timeoutId = setTimeout(() => {
            func.apply(context, args)
         }, delay)
      }
   },
   throttle: (func, delay) => {
      let lastCall = 0
      return function (...args) {
         const context = this
         const now = Date.now()
         if (now - lastCall >= delay) {
            func.apply(context, args)
            lastCall = now
         }
      }
   },
   onWidthChange: (callback, debounceMs = 150) => {
      let lastWidth = window.innerWidth
      let timeoutId = null

      function handleResize() {
         if (timeoutId) {
            clearTimeout(timeoutId)
         }

         timeoutId = setTimeout(() => {
            const currentWidth = window.innerWidth

            if (currentWidth !== lastWidth) {
               lastWidth = currentWidth
               callback(currentWidth)
            }
         }, debounceMs)
      }

      window.addEventListener('resize', handleResize)

      return () => {
         if (timeoutId) {
            clearTimeout(timeoutId)
         }
         window.removeEventListener('resize', handleResize)
      }
   },
   inputMasks: () => {
      $('input[data-input-type]').each(function () {
         const inputType = $(this).data('input-type')

         switch (inputType) {
            case 'text':
               // Маска для текстового поля (дозволяє тільки літери та пробіли)
               $(this).inputmask({
                  mask: '*{1,50}',
                  definitions: {
                     '*': {
                        validator: '[A-Za-zА-Яа-яЁё\\s]',
                        cardinality: 1,
                     },
                  },
               })
               break

            case 'number':
               // Маска для числового поля (дозволяє тільки цифри)
               $(this).inputmask({
                  mask: '9{1,10}',
                  placeholder: '',
                  clearIncomplete: true,
                  showMaskOnHover: true,
                  showMaskOnFocus: true,
                  showMaskOnBlur: true,
               })
               break

            case 'email':
               // Маска для email
               $(this).inputmask({
                  mask: '*{1,64}@*{1,64}.*{1,10}',
                  greedy: false,
                  definitions: {
                     '*': {
                        validator: "[0-9A-Za-z!#$%&'*+/=?^_`{|}~-]",
                        cardinality: 1,
                     },
                  },
                  clearIncomplete: true,
                  showMaskOnHover: true,
                  showMaskOnFocus: true,
                  showMaskOnBlur: true,
               })
               break

            // case 'phone':
            //    $(this).inputmask({
            //       mask: '+9[9][9] 9{1,3} 9{1,3} 9{1,2} 9{1,2}',
            //       greedy: false,
            //       keepStatic: false,
            //       clearIncomplete: true,
            //    })
            //    break
         }
      })
   },
   copyToClipboard: stringToCopy => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
         navigator.clipboard
            .writeText(stringToCopy)
            .then(() => {})
            .catch(err => {
               console.error('Failed to copy with clipboard API', err)
               fallbackCopy(stringToCopy)
            })
      } else {
         fallbackCopy(stringToCopy)
      }

      function fallbackCopy(text) {
         const textarea = document.createElement('textarea')
         textarea.value = text
         textarea.style.position = 'fixed' // avoid scrolling to bottom
         textarea.style.opacity = '0'
         document.body.appendChild(textarea)
         textarea.focus()
         textarea.select()

         try {
            const successful = document.execCommand('copy')
            if (successful) {
               console.log('Link copied using fallback method!')
            } else {
               console.warn('Fallback copy failed')
            }
         } catch (err) {
            console.error('Fallback copy error', err)
         }
         document.body.removeChild(textarea)
      }
   },
}

APP.gsapConfig = () => {
   // ScrollSmoother
   gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

   APP.utils.onWidthChange(() => {
      ScrollTrigger.refresh()
   })
   window.addEventListener('load', () => {
      setTimeout(() => ScrollTrigger.refresh(), 100)
   })
}

APP.fullScreenVideoPlayer = {
   played: true,
   videoEl: null,
   pause: function () {
      if (this.videoEl) this.videoEl.pause()
   },
   play: function () {
      if (this.videoEl) this.videoEl.play()
   },
   init: function () {
      const that = this
      const $btn = $('.full-screen--video-toggle')
      this.videoEl = $('.full-screen--video--video').get()[0]
      if (!this.videoEl) {
         return
      }

      $btn.click(function () {
         $(this).toggleClass('active', that.played)
         that.played = !that.played

         if (that.played) {
            that.play()
         } else {
            that.pause()
         }
      })
   },
}
APP.animationNumbers = () => {
   const duration = 3
   const startViewport = 'top bottom+=50'
   function animateNumbers() {
      // Знаходимо всі елементи з числами
      const numberElements = document.querySelectorAll('[data-animate-number]')

      if (numberElements.length === 0) {
         console.warn('No elements with data-animate-number found')
         return
      }

      numberElements.forEach(element => {
         const text = element.getAttribute('data-animate-number').trim()

         // Ініціалізуємо з 0
         initializeElement(element, text)

         // Визначаємо тип анімації
         if (text.includes('-')) {
            animateRange(element, text)
         } else if (text.includes('%')) {
            animatePercentage(element, text)
         } else if (text.includes(',') || text.includes('+')) {
            animateNumberWithSuffix(element, text)
         } else {
            animateSimpleNumber(element, text)
         }
      })
   }

   // Ініціалізація елементів з 0
   function initializeElement(element, text) {
      if (text.includes('-')) {
         element.innerHTML = `<span class="start">0</span>-<span class="end">0</span>`
      } else if (text.includes('%')) {
         element.textContent = '0%'
      } else if (text.includes('+')) {
         element.textContent = '0+'
      } else if (text.includes(',')) {
         element.textContent = '0'
      } else {
         element.textContent = '0'
      }

      // Додаємо overflow для ефекту прогортування
      element.style.overflow = 'hidden'
      element.style.display = 'inline-block'
   }

   // Анімація діапазону (2-10) з прогортуванням
   function animateRange(element, text) {
      const [start, end] = text.split('-').map(num => parseInt(num.trim()))

      const startSpan = element.querySelector('.start')
      const endSpan = element.querySelector('.end')

      const obj = { start: 0, end: 0 }

      ScrollTrigger.create({
         trigger: element,
         start: startViewport,
         onEnter: () => {
            gsap.to(obj, {
               start: start,
               end: end,
               duration: duration,
               ease: 'power2.out',
               onUpdate: () => {
                  startSpan.textContent = Math.round(obj.start)
                  endSpan.textContent = Math.round(obj.end)
               },
            })
         },
         once: true,
      })
   }

   // Анімація відсотків (100%) з прогортуванням
   function animatePercentage(element, text) {
      const targetValue = parseInt(text.replace('%', ''))
      const obj = { value: 0 }

      ScrollTrigger.create({
         trigger: element,
         start: startViewport,
         onEnter: () => {
            gsap.to(obj, {
               value: targetValue,
               duration: duration,
               ease: 'power2.out',
               onUpdate: () => {
                  element.textContent = Math.round(obj.value) + '%'
               },
            })
         },
         once: true,
      })
   }

   // Анімація чисел з комами та суфіксом (3,000+) з прогортуванням
   function animateNumberWithSuffix(element, text) {
      const hasSuffix = text.includes('+')
      const cleanNumber = text.replace(/[,+]/g, '')
      const targetValue = parseInt(cleanNumber)
      const obj = { value: 0 }

      ScrollTrigger.create({
         trigger: element,
         start: startViewport,
         onEnter: () => {
            gsap.to(obj, {
               value: targetValue,
               duration: duration,
               ease: 'power2.out',
               onUpdate: () => {
                  const currentValue = Math.round(obj.value)
                  const formattedValue = currentValue.toLocaleString('en-US')
                  element.textContent = formattedValue + (hasSuffix ? '+' : '')
               },
            })
         },
         once: true,
      })
   }

   // Анімація простого числа (5) з прогортуванням
   function animateSimpleNumber(element, text) {
      const targetValue = parseInt(text)
      const obj = { value: 0 }

      ScrollTrigger.create({
         trigger: element,
         start: startViewport,
         onEnter: () => {
            gsap.to(obj, {
               value: targetValue,
               duration: duration,
               ease: 'power2.out',
               onUpdate: () => {
                  element.textContent = Math.round(obj.value)
               },
            })
         },
         once: true,
      })
   }

   // Викликаємо анімацію
   animateNumbers()
}

APP.commitmentAnimationGSAP = () => {
   let masterTimeline = null
   let currentImageIndex = 0
   const durations = {
      start: 0.6,
      pause: 1.5,
      change: 0.4,
      final: 0.3,
   }

   const cardGroupsDesktop = [
      [1, 5, 12],
      [2, 8, 4],
      [3, 10, 15],
      [6, 11, 13],
      [7, 9, 14],
      [16, 10, 6],
   ]
   const cardGroupsMobile = [
      [3, 1, 5],
      [4, 6, 2],
   ]
   const getCardGroups = () => (window.innerWidth > 767 ? cardGroupsDesktop : cardGroupsMobile)
   const resizeHandle = () => {
      startAnimation()
   }
   APP.utils.onWidthChange(resizeHandle)

   // Масив зображень для заміни
   const images = [
      './assets/images/zoom-animation/img-1.png',
      './assets/images/zoom-animation/img-2.png',
      './assets/images/zoom-animation/img-3.png',
      './assets/images/zoom-animation/img-4.png',
      './assets/images/zoom-animation/img-5.png',
      './assets/images/zoom-animation/img-6.png',
      './assets/images/zoom-animation/img-7.png',
      './assets/images/zoom-animation/img-8.png',
      './assets/images/zoom-animation/img-9.png',
      './assets/images/zoom-animation/img-10.png',
      './assets/images/zoom-animation/img-11.png',
      './assets/images/zoom-animation/img-12.png',
      './assets/images/zoom-animation/img-13.png',
      './assets/images/zoom-animation/img-14.png',
      './assets/images/zoom-animation/img-15.png',
      './assets/images/zoom-animation/img-16.png',
   ]

   // Функція ініціалізації початкових властивостей
   const initCards = () => {
      $('.commitment .card').each(function () {
         const $card = $(this)

         // Зберігаємо початкові CSS властивості
         const initialOpacity = parseFloat($card.css('opacity')) || 0
         const initialScale = parseFloat($card.css('scale')) || 0

         // Встановлюємо початкові значення через GSAP
         gsap.set($card, {
            opacity: initialOpacity,
            scale: initialScale,
         })

         $card.data('scale', initialScale)
         $card.data('opacity', initialOpacity)
      })
   }

   const changeImage = $card => {
      const $img = $card.find('img')
      if ($img.length) {
         currentImageIndex = (currentImageIndex + 1) % images.length
         $img.attr('src', images[currentImageIndex])
      }
   }

   // Функція анімації однієї картки
   const animateCard = ($card, delay = 0) => {
      const timeline = gsap.timeline({ delay })

      // Зберігаємо початкове значення opacity
      const initialOpacity = $card.data('opacity')
      const initialScale = $card.data('scale')

      return (
         timeline
            // Поява картки
            .to($card, {
               scale: 1,
               opacity: 1,
               duration: durations.start,
               ease: 'power2.out',
            })
            // Пауза 3 секунди
            .to({}, { duration: durations.pause })
            // Зменшення scale до 0
            .to($card, {
               scale: 0,
               opacity: 0,
               duration: durations.change,
               ease: 'power2.in',
               onComplete: () => {
                  changeImage($card)
               },
            })
            .to($card, {
               opacity: initialOpacity,
               scale: initialScale,
               duration: durations.final,
               ease: 'power4.out',
            })
      )
   }

   // Функція анімації групи карток
   const animateGroup = cardIndices => {
      const timeline = gsap.timeline()

      cardIndices.forEach((cardIndex, i) => {
         const $card = $(`.commitment .card--${cardIndex}`)
         if ($card.length) {
            const delay = i * 0.25 // Затримка 0.5с між картками в групі
            animateCard($card, delay)
         }
      })

      return timeline
   }

   const startAnimation = () => {
      if (masterTimeline) {
         masterTimeline.kill() // Зупиняємо попередню анімацію
      }
      let cardGroups = getCardGroups()
      masterTimeline = gsap.timeline({
         repeat: -1, // Безкінечне повторення
         repeatDelay: 0, // Пауза перед повторенням циклу
      })

      cardGroups.forEach((group, groupIndex) => {
         // Додаємо анімацію групи
         masterTimeline.add(() => {
            animateGroup(group)
         })

         // Обчислюємо тривалість анімації групи
         const groupDuration =
            (group.length - 1) * durations.start + durations.pause + durations.change + durations.final

         // Додаємо паузу між групами
         masterTimeline.to(
            {},
            {
               duration: groupDuration + 0.5,
            }
         )
      })
   }

   // Ініціалізація при завантаженні DOM
   initCards()
   startAnimation()
}

APP.accordions = () => {
   const $items = $('.packages-intro-item')
   const itemDuration = 6000
   let currentIndex = 0
   let progressInterval = null
   let autoPlayEnabled = true
   let startTime = null
   let pausedProgress = 0

   const initFirstAccordion = () => {
      $items.first().addClass('active')
      $items.first().find('.dropdown').show()
      startProgress(0)
   }

   const startProgress = index => {
      if (!autoPlayEnabled) return
      const $item = $items.eq(index)
      startTime = Date.now() - pausedProgress
      const animate = () => {
         if (!autoPlayEnabled) return
         const elapsed = Date.now() - startTime
         const progress = Math.min((elapsed / itemDuration) * 100, 100)
         $item.css('--width', progress + '%')
         if (progress >= 100) {
            clearInterval(progressInterval)
            moveToNext()
         }
      }
      progressInterval = setInterval(animate, 4)
   }

   const stopProgress = () => {
      if (progressInterval) {
         clearInterval(progressInterval)
         progressInterval = null
         pausedProgress = Date.now() - startTime
      }
   }

   const resetProgress = index => {
      pausedProgress = 0
      startTime = null
      $items.eq(index).css('--width', '0%')
   }

   const moveToNext = () => {
      const $current = $items.eq(currentIndex)
      $current.removeClass('active')
      $current.find('.dropdown').slideUp()
      resetProgress(currentIndex)
      currentIndex = (currentIndex + 1) % $items.length
      const $next = $items.eq(currentIndex)
      $next.addClass('active')
      $next.find('.dropdown').slideDown()
      startProgress(currentIndex)
   }

   const openAccordion = index => {
      if (index === currentIndex) return
      stopProgress()
      $items.eq(currentIndex).removeClass('active')
      $items.eq(currentIndex).find('.dropdown').slideUp()
      resetProgress(currentIndex)
      currentIndex = index
      $items.eq(currentIndex).addClass('active')
      $items.eq(currentIndex).find('.dropdown').slideDown()
      if (autoPlayEnabled) {
         resetProgress(currentIndex)
         startProgress(currentIndex)
      }
   }

   $('.packages-intro-item__content h3').click(function () {
      const index = $(this).closest('.packages-intro-item').index()
      autoPlayEnabled = false
      stopProgress()
      $items.css('--width', '0%')
      openAccordion(index)
   })

   initFirstAccordion()
}

APP.packagesShuffle = () => {
   const container = $('.packages-intro__content-right')
   if (container.length <= 0) {
      return
   }
   const $small = $('.container-small')
   const $medium = $('.container-medium')
   const $big = $('.container-big')
   const $phantom = $('.container-phantom')
   const duration = 2.5
   const ease = 'power4.out'
   const delay = 3

   const multiplier = window.innerWidth > 768 ? 1 : 0.68

   const setInitialValues = () => {
      gsap.set($phantom, { opacity: 0, bottom: 500 })
      gsap.set($small, { bottom: 160 * multiplier, width: 'calc(100% - 72px)' })
      gsap.set($medium, { bottom: 80 * multiplier, width: 'calc(100% - 36px)' })
      gsap.set($big, { bottom: 0, opacity: 1, width: 'calc(100%)' })
   }

   setInitialValues()

   // Одна ітерація анімації
   const playOneCycle = () => {
      let tl = gsap.timeline({
         onComplete: () => {
            // Міняємо контент ПІСЛЯ завершення анімації
            const bigHTML = $big.html()
            const mediumHTML = $medium.html()
            const smallHTML = $small.html()

            $big.html(mediumHTML)
            $medium.html(smallHTML)
            $small.html(bigHTML)
            $phantom.html(mediumHTML)

            setInitialValues()
            // debugger
            // Запускаємо наступний цикл після паузи
            gsap.delayedCall(delay, playOneCycle)
         },
      })
      //   debugger
      tl.to($big, { bottom: -300, opacity: 0, duration, ease }, 0)
      tl.to($medium, { bottom: 0, width: '100%', duration, ease }, 0)
      tl.to($small, { bottom: 80 * multiplier, width: 'calc(100% - 36px)', duration, ease }, 0)
      tl.to($phantom, { opacity: 1, bottom: 160 * multiplier, duration, ease }, 0)
   }

   // Запускаємо перший раз
   playOneCycle()
}

APP.sliders = {
   featured: function () {
      const node = document.querySelector('.featured-story--slider')
      if (!node) {
         return
      }
      let slider = new Swiper(node, {
         slidesPerView: 1,
         spaceBetween: 20,
         loop: true,
         navigation: {
            prevEl: '.featured-story--slider-prev',
            nextEl: '.featured-story--slider-next',
         },
      })
   },
   latestNews: function () {
      const node = document.querySelector('.latest-news-slider')
      if (!node) {
         return
      }
      let slider = new Swiper(node, {
         spaceBetween: 20,
         breakpoints: {
            0: {
               slidesPerView: 'auto',
               slidesOffsetBefore: 20,
               slidesOffsetAfter: 20,
            },
            1025: {
               slidesOffsetBefore: 0,
               slidesOffsetAfter: 0,
               slidesPerView: 3,
            },
         },
         pagination: {
            el: '.latest-news-slider .swiper-pagination',
            clickable: true,
         },
      })

      if (Swiper.isLocked) {
         $('.latest-news-slider .swiper-pagination').hide()
      } else {
         $('.latest-news-slider .swiper-pagination').show()
      }
   },
   welcome: function () {
      const node = document.querySelector('.welcome-to-smile--swiper')
      if (!node) {
         return
      }
      let slider = new Swiper(node, {
         spaceBetween: 20,
         breakpoints: {
            0: {
               slidesPerView: 'auto',
               slidesOffsetBefore: 20,
               slidesOffsetAfter: 20,
            },
            1025: {
               slidesOffsetBefore: 0,
               slidesOffsetAfter: 0,
               slidesPerView: 3,
            },
         },
         pagination: {
            el: '.welcome-to-smile--swiper__pagination',
            clickable: true,
         },
      })
   },
   advantages: function () {
      const node = document.querySelector('.advantages-slider')
      if (!node) {
         return
      }
      let slider = new Swiper(node, {
         spaceBetween: 20,
         breakpoints: {
            0: {
               slidesPerView: 'auto',
               slidesOffsetBefore: 20,
               slidesOffsetAfter: 20,
            },
            1024: {
               slidesPerView: 4,
               slidesOffsetBefore: 0,
               slidesOffsetAfter: 0,
            },
         },
         pagination: {
            el: '.advantages-slider__pagination',
            clickable: true,
         },
      })
   },
   partners: function () {
      const node = document.querySelector('.partners__swiper')
      if (!node) {
         return
      }
      let slider = new Swiper(node, {
         spaceBetween: 20,
         breakpoints: {
            0: {
               slidesPerView: 'auto',
               slidesOffsetBefore: 20,
               slidesOffsetAfter: 20,
            },
            1024: {
               slidesPerView: 6,
               slidesOffsetBefore: 0,
               slidesOffsetAfter: 0,
            },
         },
      })
   },
   howToApply: function () {
      const node = document.querySelector('.how-to-apply-swiper')
      if (!node) {
         return
      }
      let slider = new Swiper(node, {
         spaceBetween: 20,
         slidesPerView: 1,
         pagination: {
            el: '.how-to-apply-swiper__pagination',
            clickable: true,
         },
      })
   },
   impactByNumbers: function () {
      const node = document.querySelector('.impact-swiper')
      if (!node) {
         return
      }
      let slider = new Swiper(node, {
         spaceBetween: 20,
         breakpoints: {
            0: {
               slidesPerView: 'auto',
               slidesOffsetBefore: 20,
               slidesOffsetAfter: 20,
            },
            1025: {
               slidesOffsetBefore: 0,
               slidesOffsetAfter: 0,
               slidesPerView: 3,
            },
         },
      })
   },
   stories: function () {
      const node = document.querySelector('.stories--swiper')
      if (!node) {
         return
      }
      let slider = new Swiper(node, {
         spaceBetween: 20,
         slidesPerView: 1,
         effect: 'fade',
         loop: true,
         navigation: {
            prevEl: '.stories--swiper-prev',
            nextEl: '.stories--swiper-next',
         },
      })
   },
   difference: function () {
      const node = document.querySelector('.difference-slider')
      if (!node) {
         return
      }

      const calcOffsetLeft = () => {
         const node = document.querySelector('.difference-compassionate__slider__helper')
         return node.offsetLeft
      }
      const calcOffsetRight = () => {
         const node = document.querySelector('.difference-compassionate__title')
         return node.offsetLeft
      }

      let slider = new Swiper(node, {
         spaceBetween: 20,
         slidesPerView: 'auto',
         slidesOffsetBefore: calcOffsetLeft(),
         slidesOffsetAfter: calcOffsetRight(),
         navigation: {
            prevEl: '.difference-slider-prev',
            nextEl: '.difference-slider-next',
         },
         pagination: {
            el: '.difference-slider__pagination',
            clickable: true,
         },
         on: {
            resize: swiper => {
               swiper.params.slidesOffsetBefore = calcOffsetLeft()
               swiper.params.slidesOffsetAfter = calcOffsetRight()
               swiper.update()
            },
         },
      })
   },
   blog: function () {
      const node = document.querySelector('.blog-swiper')
      if (!node) {
         return
      }

      const calcOffset = () => {
         const node = document.querySelector('.blog-title-phantom-wrapper')
         return node.offsetLeft
      }
      const calcSlideWidth = () => {
         const target = document.querySelector('.blog-title-phantom-wrapper .target')
         return target ? target.offsetWidth : null
      }
      const isMobile = () => window.innerWidth <= 767
      const slides = node.querySelectorAll('.blog-swiper .swiper-slide')
      const initialWidth = calcSlideWidth()

      if (initialWidth && !isMobile()) {
         slides.forEach(slide => {
            slide.style.width = `${initialWidth}px`
         })
      }
      let slider = new Swiper(node, {
         spaceBetween: 20,
         slidesPerView: 'auto',
         slidesOffsetBefore: calcOffset(),
         slidesOffsetAfter: calcOffset(),
         navigation: {
            prevEl: '.blog-slider-prev',
            nextEl: '.blog-slider-next',
         },
         pagination: {
            el: '.blog-slider__pagination',
            clickable: true,
         },
         on: {
            resize: swiper => {
               const slides = swiper.el.querySelectorAll('.swiper-slide')
               const newWidth = calcSlideWidth()

               swiper.params.slidesOffsetBefore = calcOffset()
               swiper.params.slidesOffsetAfter = calcOffset()

               if (isMobile()) {
                  // На мобілці скидаємо inline стилі
                  slides.forEach(slide => {
                     slide.style.width = ''
                  })
               } else if (newWidth) {
                  // На десктопі встановлюємо ширину як у .target
                  slides.forEach(slide => {
                     slide.style.width = `${newWidth}px`
                  })
               }

               swiper.update()
            },
         },
      })
   },
   submit: function () {
      const node = document.querySelector('.submit-request-slider')
      if (!node) {
         return
      }
      let slider = new Swiper(node, {
         spaceBetween: 20,
         breakpoints: {
            0: {
               slidesPerView: 'auto',
               slidesOffsetBefore: 20,
               slidesOffsetAfter: 20,
            },
            1025: {
               slidesOffsetBefore: 0,
               slidesOffsetAfter: 0,
               slidesPerView: 3,
            },
         },
         pagination: {
            el: '.submit-request-slider-pagination',
            clickable: true,
         },
      })
   },
   education: function () {
      const node = document.querySelector('.education-slider')
      if (!node) {
         return
      }
      let slider = new Swiper(node, {
         spaceBetween: 20,
         breakpoints: {
            0: {
               slidesPerView: 'auto',
               slidesOffsetBefore: 20,
               slidesOffsetAfter: 20,
            },
            1025: {
               slidesOffsetBefore: 0,
               slidesOffsetAfter: 0,
               slidesPerView: 3,
            },
         },
         pagination: {
            el: '.education-slider-pagination',
            clickable: true,
         },
      })
   },

   init: function () {
      this.featured()
      this.latestNews()
      this.welcome()
      this.advantages()
      this.partners()
      this.howToApply()
      this.impactByNumbers()
      this.stories()
      this.difference()
      this.blog()
      this.submit()
      this.education()
   },
}

APP.header = {
   changeTheme: function () {
      const header = document.querySelector('header')
      if (header && header.hasAttribute('data-no-observe')) {
         return
      }

      // Зберігаємо початкову тему (якщо вона є)
      const initialTheme = header.getAttribute('data-theme') || 'white'
      header.setAttribute('data-initial-theme', initialTheme)

      const darkSections = document.querySelectorAll('[data-add-header-dark-theme]')

      const options = {
         rootMargin: `-${header.offsetHeight}px 0px 0px 0px`,
         threshold: 0,
      }

      const observerCallback = entries => {
         entries.forEach(entry => {
            if (entry.isIntersecting) {
               // Header над темною секцією - ставимо dark (пустий атрибут)
               header.setAttribute('data-theme', '')
            } else {
               // Перевіряємо, чи header над якоюсь іншою темною секцією
               const isOverDarkSection = Array.from(darkSections).some(section => {
                  const rect = section.getBoundingClientRect()
                  const headerBottom = header.offsetHeight
                  return rect.top <= headerBottom && rect.bottom >= headerBottom
               })

               if (!isOverDarkSection) {
                  // Перевіряємо позицію скролу
                  const scrollTop = window.pageYOffset || document.documentElement.scrollTop

                  if (scrollTop > header.offsetHeight) {
                     // Проскролили вниз - ставимо scrolled
                     header.setAttribute('data-theme', 'scrolled')
                  } else {
                     // На початку сторінки - повертаємо initial theme
                     const initialTheme = header.getAttribute('data-initial-theme') || 'white'
                     header.setAttribute('data-theme', initialTheme)
                  }
               }
            }
         })
      }

      // Додаємо слухач скролу для відслідковування повернення на початок
      let scrollTimeout
      window.addEventListener('scroll', () => {
         const scrollTop = window.pageYOffset || document.documentElement.scrollTop
         const currentTheme = header.getAttribute('data-theme')
         const initialTheme = header.getAttribute('data-initial-theme') || 'white'

         // Перевіряємо, чи не над темною секцією
         const isOverDarkSection = Array.from(darkSections).some(section => {
            const rect = section.getBoundingClientRect()
            const headerBottom = header.offsetHeight
            return rect.top <= headerBottom && rect.bottom >= headerBottom
         })

         if (!isOverDarkSection) {
            if (scrollTop <= header.offsetHeight && currentTheme !== initialTheme) {
               // Повернулись на початок - ставимо initial theme
               header.setAttribute('data-theme', initialTheme)
            } else if (scrollTop > header.offsetHeight && currentTheme !== 'scrolled') {
               // Проскролили вниз - ставимо scrolled
               header.setAttribute('data-theme', 'scrolled')
            }
         }
      })

      const observer = new IntersectionObserver(observerCallback, options)
      darkSections.forEach(section => {
         observer.observe(section)
      })
   },
   desktopResourcesMenu: function () {
      const $btn = $('.header__container-navigation [data-open-resource-menu]')
      const $container = $('.header .resource-menu__container')
      const $modal = $('.header .resource-menu')
      let isOpen = false

      const handler = () => {
         if (isOpen) {
            closeDropDown()
         } else {
            openDropdown()
         }
         $btn.toggleClass('active', isOpen)
      }
      const openDropdown = () => {
         isOpen = true

         const height = window.innerHeight - $('header').innerHeight()
         $modal.show()
         $modal.css({
            height,
         })
         $modal.addClass('active')

         $container.slideDown()
      }
      const closeDropDown = () => {
         isOpen = false
         $container.slideUp(400)
         $modal.removeClass('active')
         setTimeout(() => {
            $modal.hide()
         }, 401)
      }

      const INTERACTIVE_ELEMENTS =
         '.header resource-menu__container, .header__container-navigation [data-open-resource-menu]'
      document.addEventListener('click', e => {
         if (!$(e.target).closest(INTERACTIVE_ELEMENTS).length) {
            closeDropDown()
         }
      })
      $btn.click(handler)
   },
   mobileNavigationMenu: function () {
      const $btn = $('.mobile-open-navigation-menu')
      const $modal = $('.mobile-navigation-menu')
      const $modalContainer = $modal.find('.mobile-navigation-menu__container')
      let isOpen = false

      let initialHeaderTheme = null

      const setInitialHeaderTheme = () => {
         return $('.header').data('theme')
      }

      const timeline = gsap.timeline({ paused: true })
      timeline.to($modalContainer[0], {
         x: '0%',
         duration: 0.4,
         ease: 'power2.out',
      })

      const handler = () => {
         if (isOpen) {
            closeDropDown()
         } else {
            openDropdown()
         }
         $btn.toggleClass('active', isOpen)
      }
      const openDropdown = () => {
         isOpen = true
         initialHeaderTheme = setInitialHeaderTheme()

         $modal.css({
            display: 'flex',
            width: '100%',
         })

         setTimeout(() => {
            $('.header').attr('data-theme', 'white')
         }, 300)
         // Запускаємо timeline вперед
         timeline.play()
      }
      const closeDropDown = () => {
         isOpen = false
         $('.header').attr('data-theme', initialHeaderTheme)

         timeline.reverse().then(() => {
            // Після завершення анімації ховаємо модалку
            $modal.css({
               display: 'none',
               width: '0',
            })
         })
      }
      $btn.click(handler)

      //   const INTERACTIVE_ELEMENTS = '.header .resource-menu, .header__container-navigation [data-open-resource-menu]'
      //   document.addEventListener('click', e => {
      //      if (!$(e.target).closest(INTERACTIVE_ELEMENTS).length) {
      //         closeDropDown()
      //      }
      //   })
   },
   mobileMenuDropDown: function () {
      $('.mobile-navigation-menu__container .dropdown__header').click(function () {
         $(this).toggleClass('active')
         $(this).siblings('.dropdown__body').slideToggle()
      })
   },

   init: function () {
      this.changeTheme()
      this.desktopResourcesMenu()
      this.mobileNavigationMenu()
      this.mobileMenuDropDown()
   },
}

APP.footer = {
   dropdown: function () {
      $('.footer-item.with-dropdown').click(function () {
         $(this).toggleClass('active')
         $(this).siblings('.footer-item__dropdown-body').slideToggle()
      })
   },

   init: function () {
      this.dropdown()
   },
}

APP.FAQ = () => {
   const $faqItems = $('.faq-item')

   if ($faqItems.length <= 0) {
      return
   }

   $faqItems.click(function () {
      $(this).toggleClass('active')
      $(this).find('.faq-item__body').slideToggle(600)
   })
}

APP.waysToHelp = {
   currentMode: null, // 'desktop' або 'mobile'
   breakpoint: 767,

   desktop: {
      navigation: null,
      sticky: null,
      images: null,
      navLinks: null,
      stickyItems: null,
      pagination: null,
      scrollTriggers: [],
      oldIndex: null,
      isInitialized: false,

      setNodes: function () {
         this.navigation = $('.ways-content__navigation')
         this.navLinks = $('.ways-content__navigation nav .link')
         this.sticky = $('.ways-content__desktop .sticky')
         this.images = $('.ways-content__desktop .images-container .item')
         this.stickyItems = $('.ways-content__desktop .sticky .item')
         this.imageItem = $('.ways-content__desktop .images-container .item')
         this.pagination = $('.ways-content__desktop .pagination')
      },

      setSizes: function () {
         this.headerHeight = $('header').innerHeight()
         this.navigationHeight = this.navigation.innerHeight()

         const headerHeight = this.headerHeight
         const navigationHeight = this.navigationHeight
         const that = this

         this.navigation.css({
            top: headerHeight,
         })

         const height = window.innerHeight - headerHeight - navigationHeight - 32 - 16
         const top = headerHeight + navigationHeight + 16

         this.sticky.css({
            height,
            top,
         })

         this.imageItem.css({
            maxHeight: height,
         })

         let maxContentHeight = 0

         this.stickyItems.each(function (id, item) {
            const contentHeight = $(item).find('.content').innerHeight()
            const totalContentHeight = headerHeight + navigationHeight + contentHeight

            // Знаходимо максимальну висоту контенту
            if (contentHeight > maxContentHeight) {
               maxContentHeight = contentHeight
            }

            if (height < totalContentHeight) {
               that.sticky.css({
                  gridColumn: '7 / span 6',
               })
            }
         })

         // Розраховуємо bottom на основі найбільшого контенту
         const calcEmptySpace = (height - maxContentHeight) / 2
         const paginationHeight = this.pagination.innerHeight()

         if (calcEmptySpace > 6) {
            this.pagination.css({
               bottom: (calcEmptySpace - paginationHeight) / 2,
            })
         } else {
            this.pagination.hide()
         }
      },
      createBullets: function () {
         const count = this.images.length

         for (let i = 0; i < count; i++) {
            const bullet = document.createElement('div')
            bullet.classList.add('bullet')
            this.pagination.append(bullet)
         }
         this.bullets = $('.ways-content__desktop .pagination .bullet')
      },

      changeSlide: function (index) {
         //  this.setSizes()
         if (index === this.oldIndex) {
            return
         }
         this.oldIndex = index

         //  change navigation link
         this.navLinks.removeClass('active')
         this.navLinks.eq(index).addClass('active')

         //  change slide
         this.stickyItems.hide()
         this.stickyItems.eq(index).fadeIn(400)

         //change active bullet
         this.bullets.removeClass('active')
         this.bullets.eq(index).addClass('active')
      },
      initScrollTriggers: function () {
         const self = this
         const offset = 200

         this.scrollTriggers.forEach(trigger => trigger.kill())
         this.scrollTriggers = []

         this.images.each(function (index) {
            const trigger = gsap.timeline({
               scrollTrigger: {
                  trigger: $(this)[0],
                  start: `top center`,
                  end: `center+=${offset} center`,
                  onEnter: () => {
                     self.changeSlide(index)
                  },
                  onEnterBack: () => {
                     self.changeSlide(index)
                  },
               },
            })

            self.scrollTriggers.push(trigger.scrollTrigger)
         })
      },
      initNavigation: function () {
         const self = this

         this.navLinks.on('click', function (e) {
            e.preventDefault()
            const index = $(this).index()
            const targetImage = self.images.eq(index)

            if (targetImage.length) {
               const offset = targetImage.offset().top - window.innerHeight / 2 + targetImage.height() / 2

               $('html, body').animate(
                  {
                     scrollTop: offset,
                  },
                  800
               )
            }
         })
      },

      destroy: function () {
         if (!this.isInitialized) return

         this.scrollTriggers.forEach(trigger => trigger.kill())
         this.scrollTriggers = []

         if (this.navLinks) {
            this.navLinks.off('click')
         }

         $(window).off('resize.waysToHelpDesktop')

         this.isInitialized = false
      },

      init: function () {
         if (this.isInitialized) return

         this.setNodes()
         this.setSizes()
         this.createBullets()

         this.initScrollTriggers()
         this.initNavigation()

         const self = this

         const handleResize = APP.utils.debounce(() => {
            self.setSizes()
            ScrollTrigger.refresh()
         }, 300)

         window.addEventListener('resize', handleResize)

         this.isInitialized = true
      },
   },

   mobile: {
      isInitialized: false,

      destroy: function () {
         if (!this.isInitialized) return

         $('.ways-content__mobile .ways-content-mobile__item').each(function () {
            $(this).off('click')
            $(this).removeClass('active')
            $(this).find('.ways-content-mobile__item-body').hide()
         })

         this.isInitialized = false
      },

      init: function () {
         if (this.isInitialized) return
         const dropdown = '.ways-content-mobile__item-body'
         const heading = '.ways-content-mobile__item-heading'

         const $items = $('.ways-content__mobile .ways-content-mobile__item')
         const $firstItem = $items.first()

         //  show first item content
         $firstItem.addClass('active')
         $firstItem.find(dropdown).show()

         $items.each(function (id, item) {
            $(item).on('click', function () {
               $(this).find(heading).parent().toggleClass('active')
               $(this).find(dropdown).slideToggle()
            })
         })

         this.isInitialized = true
      },
   },

   checkAndInitialize: function () {
      const currentWidth = window.innerWidth
      const newMode = currentWidth <= this.breakpoint ? 'mobile' : 'desktop'

      if (this.currentMode === newMode) {
         return
      }

      if (this.currentMode === 'desktop') {
         this.desktop.destroy()
      } else if (this.currentMode === 'mobile') {
         this.mobile.destroy()
      }

      this.currentMode = newMode

      if (newMode === 'desktop') {
         this.desktop.init()
      } else {
         this.mobile.init()
      }
   },

   init: function () {
      if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
         console.error('GSAP та ScrollTrigger повинні бути завантажені')
         return
      }

      gsap.registerPlugin(ScrollTrigger)

      this.checkAndInitialize()

      const self = this
      APP.utils.onWidthChange(function (width) {
         self.checkAndInitialize()
      })
   },
}

APP.formDropdown = () => {
   const $dropdowns = $('.ui-dropdown')
   if ($dropdowns.length <= 0) {
      return
   }

   $dropdowns.each(function (id, dropdown) {
      $(dropdown)
         .find('.ui-dropdown-button')
         .click(function (e) {
            e.stopPropagation()
            $(this).parent().toggleClass('active')
            $(this).siblings('.ui-dropdown__popup').slideToggle()
         })

      const inputInitialValue = $(dropdown).find('input').val()
      if (inputInitialValue) {
         $(dropdown).find('.ui-dropdown__popup .set-dropdown-value').first().addClass('active')
      }
   })

   $(document).click(function (e) {
      $dropdowns.each(function () {
         const $dropdown = $(this)
         const $popup = $dropdown.find('.ui-dropdown__popup')

         if (!$dropdown.is(e.target) && $dropdown.has(e.target).length === 0) {
            $popup.slideUp()
            $dropdown.removeClass('active')
         }
      })
   })

   $('.ui-dropdown__popup .set-dropdown-value').click(function (e) {
      e.stopPropagation()
      const $parent = $(this).parent()
      const value = $(this).find('.text').html()
      $parent.find('.set-dropdown-value').removeClass('active')
      $(this).addClass('active')
      $parent.parent().find('input').val(value)
      $parent.parent().find('.ui-dropdown-button .text').html(value)
      $parent.parent().find('.ui-dropdown-button .text').removeClass('empty')
      $parent.slideUp()
   })
}

APP.tooltips = () => {
   const tooltips = document.querySelectorAll('.tooltip.tippy')

   if (tooltips.length <= 0) {
      return
   }

   tooltips.forEach(tooltip => {
      const instance = tippy(tooltip, {
         content: reference => {
            const tipContent = reference.getAttribute('data-content-tippy')
            return `<p>${tipContent}</p>`
         },
         allowHTML: true,
         theme: '#060D13',
         arrow: true,
         placement: 'top',
         interactive: true,
         //  trigger: 'click',
         animation: 'scale',
         zIndex: 10,
         offset: [0, 12],
      })
   })
}

APP.packagesMobileShowMore = () => {
   const BREAKPOINT = 1024
   const VISIBLE_ITEMS = 3

   const initPackage = packageEl => {
      const receiveUl = $(packageEl).find('.receive ul')
      const showMoreBtn = $(packageEl).find('.show-more')
      const items = receiveUl.find('li')

      if (items.length <= VISIBLE_ITEMS) {
         showMoreBtn.hide()
         items.show()
         return
      }

      if ($(window).width() < BREAKPOINT) {
         // Показуємо тільки перші 3 елементи
         items.each(function (index) {
            if (index >= VISIBLE_ITEMS) {
               $(this).hide()
            } else {
               $(this).show()
            }
         })
         showMoreBtn.show()

         // Видаляємо попередній обробник, щоб уникнути дублювання
         showMoreBtn.off('click.showMore')

         // Додаємо обробник кліку
         showMoreBtn.on('click.showMore', function () {
            const hiddenItems = items.filter(':hidden')

            // Ховаємо кнопку
            $(this).hide()

            // Анімуємо появу прихованих елементів по черзі
            hiddenItems.each(function (index) {
               const item = $(this)

               // Встановлюємо початкові значення
               gsap.set(item, {
                  opacity: 0,
                  x: 20,
                  display: 'flex',
               })

               // Анімуємо з затримкою для кожного елемента
               gsap.to(item, {
                  opacity: 1,
                  x: 0,
                  duration: 0.5,
                  delay: index * 0.15,
                  ease: 'power2.out',
               })
            })
         })
      } else {
         // Для великих екранів показуємо всі елементи
         items.show()
         gsap.set(items, { opacity: 1, x: 0 })
         showMoreBtn.hide()
      }
   }

   // Ініціалізуємо всі пакети
   const initAllPackages = () => {
      $('.packeges-page-content__grid .package').each(function () {
         initPackage(this)
      })
   }

   // Запускаємо при завантаженні
   initAllPackages()

   const handleResize = APP.utils.debounce(() => {
      initAllPackages()
   }, 300)

   window.addEventListener('resize', handleResize)
}

APP.reports = {
   navigation: function () {
      const $parent = $('.report-navigation__content')
      const $btn = $parent.find('.toggle-content')
      const $menu = $parent.find('.navigation-menu')
      let isMobile = false

      const toggleDisplay = () => {
         if (window.innerWidth > 767) {
            $menu.show()
            isMobile = false
         } else {
            $menu.hide()
            isMobile = true
         }
      }

      $btn.on('click', function () {
         if (!isMobile) {
            return
         }

         $(this).toggleClass('active')
         $menu.slideToggle()

         const INTERACTIVE_ELEMENTS = '.report-navigation__content'
         $(document).click(function (e) {
            if (!$(e.target).closest(INTERACTIVE_ELEMENTS).length) {
               $menu.slideUp()
               $btn.removeClass('active')
            }
         })
      })

      toggleDisplay()

      APP.utils.onWidthChange(toggleDisplay, 50)
   },
   init: function () {
      this.navigation()
   },
}

APP.copy = {
   copyInformation: function () {
      $('.copy-information button').click(function () {
         const copiedText = $(this).find('.text').html()

         $(this).addClass('copied')

         setTimeout(() => {
            $(this).removeClass('copied')
         }, 5000)

         APP.utils.copyToClipboard(copiedText)
      })
   },

   init: function () {
      this.copyInformation()
   },
}

APP.sharePostIntoSoccials = {
   shareUrl: window.location.href,
   timeout: null,
   shareToFacebook: function () {
      const self = APP.sharePostIntoSoccials
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(self.shareUrl)}`
      window.open(facebookUrl, '_blank', 'width=600,height=400')
   },
   shareToLinkedIn: function () {
      const self = APP.sharePostIntoSoccials
      const linkedinUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(self.shareUrl)}`
      window.open(linkedinUrl, '_blank', 'width=600,height=400')
   },
   copyLink: function () {
      const self = APP.sharePostIntoSoccials
      const textToCopy = self.shareUrl
      APP.utils.copyToClipboard(textToCopy)
      self.showMessage()
   },
   showMessage: function () {
      const self = APP.sharePostIntoSoccials
      $('.share .message').slideDown()

      if (self.timeout) {
         $('.share .message').slideUp().slideDown()
         clearTimeout(self.timeout)
      }
      self.timeout = setTimeout(() => {
         $('.share .message').slideUp()
      }, 5000)
   },
   shareToX: function () {
      const self = APP.sharePostIntoSoccials
      const text = encodeURIComponent('Переглянь це: ')
      const url = encodeURIComponent(self.shareUrl)
      const xUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`
      window.open(xUrl, '_blank', 'width=600,height=400')
   },
   handlers: function () {
      $('.share-facebook').click(this.shareToFacebook)
      $('.share-linked-in').click(this.shareToLinkedIn)
      $('.share-x').click(this.shareToX)
      $('.share-inst').click(this.copyLink)
      $('.share-tiktok').click(this.copyLink)
      $('.share-copy').click(this.copyLink)
   },
   init: function () {
      this.handlers()
   },
}

APP.postScrollTo = () => {
   document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
         e.preventDefault()
         const target = this.getAttribute('href')

         gsap.to(window, {
            duration: 1,
            scrollTo: {
               y: target,
               offsetY: $('header').innerHeight() + 16,
            },
            ease: 'power3.out',
         })
      })
   })
}

APP.countrySelect = () => {
   const input = document.querySelector('#phone')
   const $input = $(input)
   const $errorMsg = $('.ui-input-phone-error')

   if (!input) {
      return
   }

   // 1. Ініціалізація intl-tel-input
   const iti = window.intlTelInput(input, {
      utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js',
      initialCountry: 'ca',
      separateDialCode: true,
      preferredCountries: ['ua', 'pl', 'us', 'de', 'ca'],
      autoPlaceholder: 'aggressive',
   })

   // 2. Функція оновлення маски
   function updateMask() {
      let placeholder = input.getAttribute('placeholder')

      if (!placeholder) {
         placeholder = '0000000000'
      }

      let exampleNumber = placeholder.replace(/\D/g, '')
      let length = exampleNumber.length

      let maskPattern = ''

      if (length === 9) {
         maskPattern = '999-999-999'
      } else if (length === 11) {
         maskPattern = '999-999-999-99'
      } else {
         maskPattern = '(999)-999-99-99'
      }

      // Застосовуємо маску
      $input.inputmask('remove')
      $input.inputmask({
         mask: maskPattern,
         placeholder: '_',
         showMaskOnHover: false,
         showMaskOnFocus: true,
         clearIncomplete: true,
      })
   }

   iti.promise.then(function () {
      updateMask()
   })

   // 4. Подія зміни країни
   input.addEventListener('countrychange', function () {
      $input.val('')
      updateMask()
   })

   // 5. Валідація
   $input.on('blur', function () {
      if ($input.inputmask('isComplete')) {
         $errorMsg.hide()
         $input.css('border-color', '#ccc')
      } else {
         if ($input.val().length > 0) {
            $errorMsg.show()
            $input.css('border-color', 'red')
         }
      }
   })
}

APP.dragAndDropFiles = () => {
   const $dropArea = $('#dropArea')

   $dropArea.on('dragenter dragover', function (e) {
      e.preventDefault()
      e.stopPropagation()
      $dropArea.addClass('is-dragover')
   })

   $dropArea.on('dragleave drop', function (e) {
      e.preventDefault()
      e.stopPropagation()
      $dropArea.removeClass('is-dragover')
   })
   $('#openFileManager').on('click', function () {
      $('#initialFileInput').trigger('click')
   })

   $dropArea.on('drop', function (e) {
      e.preventDefault()
      e.stopPropagation()

      const files = e.originalEvent.dataTransfer.files

      if (files.length > 0) {
         handleDroppedFiles(files)
      }
   })

   $('#initialFileInput').on('change', function () {
      handleDroppedFiles(this.files)
      $(this).val('')
   })

   const DELETE_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.49994 2.08594L7.99994 6.58594L12.4999 2.08594L13.9139 3.49994L9.41394 7.99994L13.9139 12.4999L12.4999 13.9139L7.99994 9.41394L3.49994 13.9139L2.08594 12.4999L6.58594 7.99994L2.08594 3.49994L3.49994 2.08594Z" fill="currentColor"/></svg>`
   /**
    * Функція для обробки масиву об'єктів File і створення нових елементів DOM.
    * @param {FileList} files - Масив файлів, отриманих з події drop або change.
    */
   function handleDroppedFiles(files) {
      const $filesContainer = $('#filesContainer')

      // 1. Визначення дозволених розширень у нижньому регістрі
      const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png']

      for (let i = 0; i < files.length; i++) {
         const file = files[i]
         const fileName = file.name

         // 2. Отримання розширення файлу та переведення його у нижній регістр
         const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()

         // 3. Перевірка, чи розширення входить до дозволеного списку
         if (!allowedExtensions.includes(fileExtension)) {
            // Якщо формат не дозволений, пропускаємо цей файл
            console.warn(`Файл ${fileName} має непідтримуваний формат (${fileExtension}) і був проігнорований.`)

            // Можна додати сповіщення користувачу (наприклад, alert або log)
            // alert(`Недопустимий формат файлу: ${fileName}. Дозволені: PDF, JPG, PNG.`);
            continue // Перехід до наступної ітерації циклу
         }

         // 4. Якщо файл пройшов валідацію, продовжуємо його обробку

         const $newInput = $('<input type="file" style="display: none;">')

         const dataTransfer = new DataTransfer()
         dataTransfer.items.add(file)
         $newInput[0].files = dataTransfer.files

         const $fileItem = $(`
             <div class="file-item">
                 <p class="file-name">${file.name}</p>
                 <button type="button" class="file-delete-btn" title="Delete">
                     ${DELETE_SVG}
                 </button>
             </div>
         `)

         $fileItem.prepend($newInput)

         $fileItem.find('.file-delete-btn').on('click', function () {
            $fileItem.remove()
            console.log(`Видалено файл: ${file.name}`)
         })

         $filesContainer.append($fileItem)

         console.log(`Додано файл: ${file.name}`)
      }
   }
}

APP.map = {
   googleMap: null,
   startCoordinates: { lat: 35.8, lng: -95.0 },
   allMarkers: [],
   activeMarker: null,
   loadStyles: async function () {
      const response = await fetch('./js/data/mapStyles.json')
      return response.json()
   },

   loadMarkers: async function () {
      const response = await fetch('./js/data/markers.json')
      return response.json()
   },

   createMap: function (styles) {
      const mapElement = document.getElementById('map-canvas')
      if (!mapElement) {
         console.error('Елемент #map не знайдено на сторінці!')
         return
      }

      const zoom = window.innerWidth < 768 ? 3 : 4

      this.googleMap = new google.maps.Map(mapElement, {
         center: this.startCoordinates,
         zoom,
         styles,
         disableDefaultUI: true,

         //  zoomControl: false,
         //  scrollwheel: false,
         //  disableDoubleClickZoom: true,
      })
   },
   setActiveState: function (newMarker, index) {
      // 1. Скидаємо попередній активний маркер/dropdown
      if (this.activeMarker && this.activeMarker !== newMarker) {
         this.activeMarker.setIcon(this.getMarkerIcon(false))

         const prevIndex = this.allMarkers.findIndex(m => m === this.activeMarker)

         const $prevAddressEl = $('.map-address').eq(prevIndex)
         $prevAddressEl.removeClass('active')
         $prevAddressEl.find('.map-address__dropdown').slideUp()
      }

      this.activeMarker = newMarker
      this.activeMarker.setIcon(this.getMarkerIcon(true))

      const $addressEl = $('.map-address').eq(index)
      $addressEl.addClass('active')
      $addressEl.find('.map-address__dropdown').slideDown()

      const newPosition = newMarker.getPosition()
      this.googleMap.panTo(newPosition)
   },
   getMarkerIcon: function (isActive) {
      const svgInactive = `
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                <foreignObject x="-4" y="-4" width="40" height="40"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(2px);clip-path:url(#bgblur_0_7666_9470_clip_path);height:100%;width:100%"></div></foreignObject>
                <circle data-figma-bg-blur-radius="4" cx="16" cy="16" r="16" fill="white" fill-opacity="0.08"/>
                <circle cx="16" cy="16" r="6" fill="#D8E6F1"/>
                <defs><clipPath id="bgblur_0_7666_9470_clip_path" transform="translate(4 4)"><circle cx="16" cy="16" r="16"/></clipPath></defs>
            </svg>
        `

      const svgActive = `
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                <foreignObject x="-4" y="-4" width="40" height="40"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(2px);clip-path:url(#bgblur_0_7666_9474_clip_path);height:100%;width:100%"></div></foreignObject>
                <circle data-figma-bg-blur-radius="4" cx="16" cy="16" r="15.5" fill="white" fill-opacity="0.32" stroke="#D8E6F1"/>
                <circle cx="16" cy="16" r="6" fill="#D8E6F1"/>
                <defs><clipPath id="bgblur_0_7666_9474_clip_path" transform="translate(4 4)"><circle cx="16" cy="16" r="15.5"/></clipPath></defs>
            </svg>
        `

      const svgContent = isActive ? svgActive : svgInactive
      const size = 32 // Оскільки обидва SVG мають розмір 32x32

      return {
         url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgContent),
         // Встановлюємо розмір іконки
         scaledSize: new google.maps.Size(size, size),
         // Встановлюємо якір, щоб центр кола був точно над координатою
         anchor: new google.maps.Point(size / 2, size / 2),
      }
   },
   createMarkers: async function () {
      const markerData = await this.loadMarkers()
      const addressesList = document.querySelector('.map__addresses--list')

      markerData.forEach((markerInfo, index) => {
         // Створюємо маркер з неактивною іконкою
         const marker = new google.maps.Marker({
            position: {
               lat: markerInfo.coordinates.lat,
               lng: markerInfo.coordinates.lng,
            },
            map: this.googleMap,
            title: markerInfo.name,
            icon: this.getMarkerIcon(false),
         })

         this.allMarkers.push(marker) // Зберігаємо маркер

         marker.addListener('click', () => {
            this.setActiveState(marker, index)
         })

         const addressEl = addressesList.children[index]
         if (addressEl) {
            addressEl.addEventListener('click', () => {
               this.setActiveState(marker, index)
            })
         }
      })
   },

   init: async function () {
      const styles = await this.loadStyles()
      this.createMap(styles)

      this.createMarkers()
   },
}

document.addEventListener('DOMContentLoaded', event => {
   APP.gsapConfig()
   APP.utils.inputMasks()
   APP.postScrollTo()

   //    logic
   APP.header.init()
   APP.footer.init()
   APP.fullScreenVideoPlayer.init()
   APP.waysToHelp.init()
   APP.reports.init()
   APP.copy.init()
   APP.sharePostIntoSoccials.init()
   //    APP.map.init()

   APP.FAQ()
   APP.formDropdown()
   APP.tooltips()
   APP.packagesMobileShowMore()
   APP.countrySelect()
   APP.dragAndDropFiles()

   //    animations
   APP.animationNumbers()
   APP.commitmentAnimationGSAP()
   APP.accordions()
   APP.packagesShuffle()

   APP.sliders.init()

   setTimeout(() => ScrollTrigger.refresh(), 100)
})
