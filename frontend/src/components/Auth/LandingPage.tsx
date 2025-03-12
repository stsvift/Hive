'use client'

import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import type { RootState } from '../../store'
import './LandingPage.css'

const LandingPage = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const navigate = useNavigate()
  const [activeFeature, setActiveFeature] = useState(0)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  // Ref for animation elements
  const revealRefs = useRef<Array<HTMLElement | null>>([])

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/desktop')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Scroll animation effect
  useEffect(() => {
    const handleScroll = () => {
      revealRefs.current.forEach(el => {
        if (!el) return

        const elementTop = el.getBoundingClientRect().top
        const elementVisible = 150

        if (elementTop < window.innerHeight - elementVisible) {
          el.classList.add('active')
        } else {
          el.classList.remove('active') // Remove class if element is no longer visible
        }
      })
    }

    window.addEventListener('scroll', handleScroll)
    // Trigger once on load
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Add to reveal refs
  const addToRefs = (el: HTMLElement | null) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el)
    }
  }

  const features = [
    {
      title: 'Файловый менеджер',
      description:
        'Организуйте свои файлы, заметки и задачи в удобной структуре папок. Поддержка перетаскивания и сложной иерархии.',
      icon: 'folder',
      color: '#4a6fa5',
      image: '/placeholder.svg?height=300&width=500',
    },
    {
      title: 'Заметки',
      description:
        'Создавайте и редактируйте заметки с удобным форматированием. Поддержка медиа контента и Markdown.',
      icon: 'sticky-note',
      color: '#6c5ce7',
      image: '/placeholder.svg?height=300&width=500',
    },
    {
      title: 'Управление задачами',
      description:
        'Планируйте свои задачи, устанавливайте приоритеты и сроки выполнения. Канбан-доски и интеграция с календарем.',
      icon: 'tasks',
      color: '#00b894',
      image: '/placeholder.svg?height=300&width=500',
    },
    {
      title: 'Уведомления',
      description:
        'Получайте уведомления о важных событиях и задачах. Настраиваемые напоминания и интеграции.',
      icon: 'bell',
      color: '#fdcb6e',
      image: '/placeholder.svg?height=300&width=500',
    },
  ]

  // New data for benefits section
  const benefits = [
    {
      title: 'Повышение продуктивности',
      description:
        'Наша система помогает вам сосредоточиться на важных задачах и избавиться от отвлекающих факторов',
      icon: 'chart-line',
    },
    {
      title: 'Удобный доступ',
      description:
        'Получите доступ к своим данным с любого устройства в любое время благодаря облачному хранилищу',
      icon: 'cloud',
    },
    {
      title: 'Командная работа',
      description:
        'Работайте над проектами вместе с коллегами, делитесь файлами и задачами в режиме реального времени',
      icon: 'users',
    },
    {
      title: 'Безопасность данных',
      description:
        'Ваши данные надежно защищены шифрованием и регулярными резервными копиями',
      icon: 'shield-alt',
    },
  ]

  // Pricing plans
  const pricingPlans = [
    {
      name: 'Базовый',
      price: 'Бесплатно',
      description: 'Идеально для начинающих пользователей',
      features: [
        'До 5 проектов',
        'До 1 ГБ хранилища',
        'Базовые возможности заметок',
        'Стандартная поддержка',
      ],
      popular: false,
      color: '#4a6fa5',
    },
    {
      name: 'Про',
      price: '590₽',
      period: 'в месяц',
      description: 'Для продвинутых пользователей и небольших команд',
      features: [
        'Неограниченное количество проектов',
        'До 10 ГБ хранилища',
        'Расширенные возможности заметок',
        'Приоритетная поддержка',
        'Совместная работа',
        'История изменений',
      ],
      popular: true,
      color: '#6c5ce7',
    },
    {
      name: 'Бизнес',
      price: '1490₽',
      period: 'в месяц',
      description: 'Для крупных команд и предприятий',
      features: [
        "Все функции тарифа 'Про'",
        'До 100 ГБ хранилища',
        'Административная панель',
        'Премиум поддержка 24/7',
        'Аналитика и отчеты',
        'API доступ',
      ],
      popular: false,
      color: '#00b894',
    },
  ]

  // FAQ items
  const faqItems = [
    {
      question: 'Что такое Hive?',
      answer:
        'Hive — это мощная платформа для управления задачами, создания заметок и организации файлов. Она предоставляет интуитивный интерфейс и широкий набор инструментов для повышения вашей продуктивности.',
    },
    {
      question: 'Как начать использовать Hive?',
      answer:
        'Чтобы начать использовать Hive, просто зарегистрируйтесь, создав бесплатную учетную запись. После этого вы сможете создавать проекты, добавлять задачи, делать заметки и загружать файлы.',
    },
    {
      question: 'Могу ли я использовать Hive бесплатно?',
      answer:
        'Да, Hive предлагает бесплатный тарифный план с базовым набором функций. Вы можете использовать его столько, сколько захотите, без обязательства перехода на платные тарифы.',
    },
    {
      question: 'Поддерживает ли Hive работу в команде?',
      answer:
        'Да, Hive предоставляет мощные инструменты для командной работы. Вы можете делиться проектами, назначать задачи другим участникам и совместно редактировать документы в реальном времени.',
    },
    {
      question: 'Как обеспечивается безопасность моих данных?',
      answer:
        'Безопасность ваших данных — наш приоритет. Мы используем шифрование при передаче и хранении данных, регулярно создаем резервные копии и соблюдаем современные стандарты безопасности.',
    },
    {
      question: 'На каких устройствах доступен Hive?',
      answer:
        'Hive доступен на всех устройствах с доступом в интернет через веб-браузер. Кроме того, у нас есть нативные приложения для iOS и Android, а также десктопные приложения для Windows и macOS.',
    },
  ]

  // Blog posts
  const blogPosts = [
    {
      title: 'Как повысить продуктивность с помощью Hive',
      excerpt:
        'Узнайте о лучших практиках организации задач и проектов для максимальной эффективности.',
      date: '15.10.2023',
      image: '/placeholder.svg?height=200&width=300',
      author: 'Алексей Смирнов',
    },
    {
      title: 'Новые функции в октябрьском обновлении',
      excerpt:
        'Мы добавили новые инструменты для управления задачами и улучшили пользовательский интерфейс.',
      date: '05.10.2023',
      image: '/placeholder.svg?height=200&width=300',
      author: 'Мария Иванова',
    },
    {
      title: 'Командная работа в Hive: полное руководство',
      excerpt:
        'Подробное руководство по использованию функций совместной работы для команд любого размера.',
      date: '28.09.2023',
      image: '/placeholder.svg?height=200&width=300',
      author: 'Дмитрий Петров',
    },
  ]

  // Toggle FAQ item
  const toggleFaq = (index: number) => {
    if (activeFaq === index) {
      setActiveFaq(null)
    } else {
      setActiveFaq(index)
    }
  }

  // Force scroll if CSS fails
  useEffect(() => {
    const forceScroll = () => {
      window.scrollTo(0, document.documentElement.scrollTop)
    }

    window.addEventListener('scroll', forceScroll)

    return () => window.removeEventListener('scroll', forceScroll)
  }, [])

  return (
    <div className="landing-page">
      {/* Background with decorative shapes */}
      <div className="landing-background">
        <div className="landing-gradient"></div>
        <div className="landing-particles">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="particle"></div>
          ))}
        </div>
        <div
          className="shape shape-circle"
          style={{ top: '20%', right: '-150px' }}
        ></div>
        <div
          className="shape shape-dots"
          style={{ bottom: '30%', left: '-100px' }}
        ></div>
      </div>

      <header className="landing-header">
        <div className="landing-logo">
          <i className="fas fa-hive"></i>
          <span>Hive</span>
        </div>
        <nav className="landing-nav">
          <Link to="/login" className="landing-button landing-button-login">
            Войти
          </Link>
          <Link
            to="/register"
            className="landing-button landing-button-register"
          >
            Регистрация
          </Link>
        </nav>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-content">
            <h1>
              <span className="text-gradient">Современная платформа</span> в
              вашем браузере
            </h1>
            <p>
              Управляйте задачами, создавайте заметки и организуйте свои файлы в
              одном месте. Доступно с любого устройства, в любое время.
            </p>
            <div className="landing-cta">
              <Link
                to="/register"
                className="landing-button landing-button-primary"
              >
                Начать бесплатно
              </Link>
              <Link
                to="/login"
                className="landing-button landing-button-secondary"
              >
                <i className="fas fa-sign-in-alt"></i> Войти в систему
              </Link>
            </div>
          </div>
          <div className="landing-hero-image">
            <div className="landing-mockup">
              <div className="landing-mockup-header">
                <div className="landing-mockup-controls">
                  <span className="landing-mockup-control red"></span>
                  <span className="landing-mockup-control yellow"></span>
                  <span className="landing-mockup-control green"></span>
                </div>
                <div className="landing-mockup-title">Hive</div>
              </div>
              <div className="landing-mockup-content">
                <img
                  src="/placeholder.svg?height=400&width=600"
                  alt="Hive Preview"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Benefits section */}
        <section className="landing-benefits-section reveal" ref={addToRefs}>
          <div className="section-heading">
            <h2>Почему выбирают Hive</h2>
            <p>
              Наша платформа предоставляет множество преимуществ, которые
              помогут вам стать более организованными и продуктивными
            </p>
          </div>

          <div className="landing-benefits-grid">
            {benefits.map((benefit, index) => (
              <div
                className={`landing-benefit-card reveal reveal-delay-${
                  index % 4
                }`}
                key={index}
                ref={addToRefs}
              >
                <div className="benefit-icon">
                  <i className={`fas fa-${benefit.icon}`}></i>
                </div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Add spacer to push features section below */}
        <div className="landing-section-spacer"></div>

        <section className="landing-features-section reveal" ref={addToRefs}>
          <div className="section-heading">
            <h2>Основные возможности</h2>
            <p>
              Изучите расширенный набор инструментов, которые сделают вашу
              работу эффективнее
            </p>
          </div>

          <div className="landing-features-tabs">
            <div className="landing-features-tab-buttons">
              {features.map((feature, index) => (
                <button
                  key={index}
                  className={`landing-features-tab-button ${
                    activeFeature === index ? 'active' : ''
                  }`}
                  onClick={() => setActiveFeature(index)}
                  style={
                    { '--accent-color': feature.color } as React.CSSProperties
                  }
                >
                  <i className={`fas fa-${feature.icon}`}></i>
                  <span>{feature.title}</span>
                </button>
              ))}
            </div>
            <div className="landing-features-tab-content">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`landing-features-tab-panel ${
                    activeFeature === index ? 'active' : ''
                  }`}
                  style={
                    { '--accent-color': feature.color } as React.CSSProperties
                  }
                >
                  <div className="landing-features-tab-panel-content">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                    <Link
                      to="/register"
                      className="landing-features-tab-button-try"
                    >
                      Попробовать
                    </Link>
                  </div>
                  <div className="landing-features-tab-panel-image">
                    <img
                      src={feature.image || '/placeholder.svg'}
                      alt={feature.title}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works section */}
        <section className="landing-how-it-works reveal" ref={addToRefs}>
          <div className="section-heading">
            <h2>Как это работает</h2>
            <p>Всего три простых шага чтобы начать работу с Hive</p>
          </div>

          <div className="landing-steps">
            <div className="landing-step reveal reveal-delay-1" ref={addToRefs}>
              <div className="landing-step-number">1</div>
              <div className="landing-step-content">
                <h3>Создайте аккаунт</h3>
                <p>
                  Зарегистрируйтесь и получите доступ ко всем функциям системы
                </p>
              </div>
            </div>
            <div className="landing-step reveal reveal-delay-2" ref={addToRefs}>
              <div className="landing-step-number">2</div>
              <div className="landing-step-content">
                <h3>Настройте рабочее пространство</h3>
                <p>Создайте папки и организуйте свои файлы, заметки и задачи</p>
              </div>
            </div>
            <div className="landing-step reveal reveal-delay-3" ref={addToRefs}>
              <div className="landing-step-number">3</div>
              <div className="landing-step-content">
                <h3>Работайте эффективно</h3>
                <p>
                  Используйте все возможности системы для повышения
                  продуктивности
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing section */}
        <section className="landing-pricing-section reveal" ref={addToRefs}>
          <div className="section-heading">
            <h2>Тарифные планы</h2>
            <p>Выберите подходящий тарифный план для ваших потребностей</p>
          </div>

          <div className="landing-pricing-grid">
            {pricingPlans.map((plan, index) => (
              <div
                className={`landing-pricing-card ${
                  plan.popular ? 'popular' : ''
                } reveal reveal-delay-${index}`}
                key={index}
                ref={addToRefs}
                style={{ '--accent-color': plan.color } as React.CSSProperties}
              >
                {plan.popular && <div className="pricing-tag">Популярный</div>}
                <h3>{plan.name}</h3>
                <div className="pricing-price">
                  <span className="price">{plan.price}</span>
                  {plan.period && <span className="period">{plan.period}</span>}
                </div>
                <p className="pricing-description">{plan.description}</p>
                <ul className="pricing-features">
                  {plan.features.map((feature, i) => (
                    <li key={i}>
                      <i className="fas fa-check"></i> {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`pricing-button ${plan.popular ? 'popular' : ''}`}
                >
                  Выбрать план
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials section */}
        <section className="landing-testimonials reveal" ref={addToRefs}>
          <div className="section-heading">
            <h2>Что говорят пользователи</h2>
            <p>Отзывы наших довольных клиентов о работе с Hive</p>
          </div>

          <div className="landing-testimonials-grid">
            <div
              className="landing-testimonial reveal reveal-delay-1"
              ref={addToRefs}
            >
              <div className="landing-testimonial-content">
                <p>
                  "Отличная система для организации моих задач и заметок.
                  Интерфейс очень интуитивный и приятный. Рекомендую всем, кто
                  хочет улучшить свою продуктивность."
                </p>
              </div>
              <div className="landing-testimonial-author">
                <div className="landing-testimonial-avatar">
                  <i className="fas fa-user"></i>
                </div>
                <div>
                  <h4>Алексей Петров</h4>
                  <p>Менеджер проектов</p>
                </div>
              </div>
            </div>
            <div
              className="landing-testimonial reveal reveal-delay-2"
              ref={addToRefs}
            >
              <div className="landing-testimonial-content">
                <p>
                  "Я использую Hive каждый день для организации своей работы.
                  Это значительно повысило мою продуктивность и помогло
                  структурировать большие проекты."
                </p>
              </div>
              <div className="landing-testimonial-author">
                <div className="landing-testimonial-avatar">
                  <i className="fas fa-user"></i>
                </div>
                <div>
                  <h4>Мария Иванова</h4>
                  <p>Фрилансер</p>
                </div>
              </div>
            </div>
            <div
              className="landing-testimonial reveal reveal-delay-3"
              ref={addToRefs}
            >
              <div className="landing-testimonial-content">
                <p>
                  "Удобный интерфейс и множество полезных функций. Теперь все
                  мои заметки и задачи всегда под рукой, а командная работа
                  стала намного эффективнее."
                </p>
              </div>
              <div className="landing-testimonial-author">
                <div className="landing-testimonial-avatar">
                  <i className="fas fa-user"></i>
                </div>
                <div>
                  <h4>Дмитрий Соколов</h4>
                  <p>Разработчик</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="landing-faq-section reveal" ref={addToRefs}>
          <div className="section-heading">
            <h2>Часто задаваемые вопросы</h2>
            <p>Ответы на самые распространенные вопросы о Hive</p>
          </div>

          <div className="landing-faq-list">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className={`landing-faq-item ${
                  activeFaq === index ? 'active' : ''
                } reveal reveal-delay-${index % 3}`}
                ref={addToRefs}
              >
                <div
                  className="landing-faq-question"
                  onClick={() => toggleFaq(index)}
                >
                  <h3>{item.question}</h3>
                  <span className="faq-icon">
                    <i
                      className={`fas fa-chevron-${
                        activeFaq === index ? 'up' : 'down'
                      }`}
                    ></i>
                  </span>
                </div>
                <div className="landing-faq-answer">
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Blog/Updates Section */}
        <section className="landing-blog-section reveal" ref={addToRefs}>
          <div className="section-heading">
            <h2>Последние обновления</h2>
            <p>Узнайте о последних функциях и новостях Hive</p>
          </div>

          <div className="landing-blog-grid">
            {blogPosts.map((post, index) => (
              <div
                className="landing-blog-card reveal reveal-delay-{index}"
                key={index}
                ref={addToRefs}
              >
                <div className="blog-image">
                  <img src={post.image} alt={post.title} />
                </div>
                <div className="blog-content">
                  <div className="blog-meta">
                    <span className="blog-date">{post.date}</span>
                    <span className="blog-author">• {post.author}</span>
                  </div>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <a href="#" className="blog-read-more">
                    Читать далее <i className="fas fa-arrow-right"></i>
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="blog-view-all-container">
            <a href="#" className="blog-view-all">
              Смотреть все статьи
            </a>
          </div>
        </section>

        {/* CTA section */}
        <section className="landing-cta-section reveal" ref={addToRefs}>
          <div className="landing-cta-content">
            <h2>Готовы начать?</h2>
            <p>
              Создайте аккаунт и начните использовать все возможности Hive прямо
              сейчас
            </p>
            <Link
              to="/register"
              className="landing-button landing-button-primary landing-button-large"
            >
              Создать бесплатный аккаунт
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-content">
          <div className="landing-footer-logo">
            <i className="fas fa-hive"></i>
            <span>Hive</span>
          </div>
          <div className="landing-footer-links">
            <div className="landing-footer-links-column">
              <h4>Продукт</h4>
              <ul>
                <li>
                  <a href="#">Возможности</a>
                </li>
                <li>
                  <a href="#">Безопасность</a>
                </li>
                <li>
                  <a href="#">Обновления</a>
                </li>
                <li>
                  <a href="#">Тарифы</a>
                </li>
              </ul>
            </div>
            <div className="landing-footer-links-column">
              <h4>Компания</h4>
              <ul>
                <li>
                  <a href="#">О нас</a>
                </li>
                <li>
                  <a href="#">Блог</a>
                </li>
                <li>
                  <a href="#">Карьера</a>
                </li>
                <li>
                  <a href="#">Контакты</a>
                </li>
              </ul>
            </div>
            <div className="landing-footer-links-column">
              <h4>Поддержка</h4>
              <ul>
                <li>
                  <a href="#">Документация</a>
                </li>
                <li>
                  <a href="#">FAQ</a>
                </li>
                <li>
                  <a href="#">Сообщество</a>
                </li>
                <li>
                  <a href="#">Поддержка</a>
                </li>
              </ul>
            </div>
            <div className="landing-footer-links-column">
              <h4>Подписаться</h4>
              <p className="footer-subscribe-text">
                Будьте в курсе последних новостей и обновлений
              </p>
              <div className="footer-subscribe">
                <input type="email" placeholder="Ваша электронная почта" />
                <button type="submit">
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <p>© 2025 Hive. Все права защищены.</p>
          <div className="landing-footer-social">
            <a href="#" className="landing-footer-social-link">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className="landing-footer-social-link">
              <i className="fab fa-facebook"></i>
            </a>
            <a href="#" className="landing-footer-social-link">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#" className="landing-footer-social-link">
              <i className="fab fa-github"></i>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
