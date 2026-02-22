# Картинки для ассоциаций глаголов

## Структура папки

Помещайте изображения для ассоциаций глаголов в эту папку.

## Формат именования

Рекомендуется называть файлы по инфинитиву глагола:

Примеры:
- `laden.jpg` или `laden.png` - для глагола "laden"
- `blasen.jpg` - для глагола "blasen"
- `fallen.jpg` - для глагола "fallen"

## Как использовать в данных

В `index.html` в объекте `window.verbsPart1` укажите путь к изображению:

```javascript
association: {
  imageUrl: '/verbs-associations/laden.jpg',
  text: 'грузить - ладонь - laden'
}
```

## Поддерживаемые форматы

- JPG / JPEG
- PNG
- WebP
- GIF

## Рекомендуемые размеры

- Ширина: 400-800px
- Высота: 300-600px
- Соотношение сторон: 4:3 или 16:9

## Пример

Для глагола "laden":
1. Загрузите картинку: `public/verbs-associations/laden.jpg`
2. В `index.html` укажите:
   ```javascript
   laden: {
     // ... другие поля
     association: {
       imageUrl: '/verbs-associations/laden.jpg',
       text: 'грузить - ладонь - laden'
     }
   }
   ```
