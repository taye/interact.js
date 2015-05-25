// {{comment}}

@font-face
  font-family: {{fontName}}
  src: url("{{fontPath}}/{{fontName}}.eot")
  src: url("{{fontPath}}/{{fontName}}.eot?#iefix") format('embedded-opentype'), url("{{fontPath}}/{{fontName}}.woff") format('woff'), url("{{fontPath}}/{{fontName}}.ttf") format('truetype'), url("{{fontPath}}/{{fontName}}.svg#{{fontName}}") format('svg')
  font-weight: normal
  font-style: normal

=icon($content)
  &:before
    -moz-osx-font-smoothing: grayscale
    -webkit-font-smoothing: antialiased
    content: $content
    font-family: '{{fontName}}'
    font-style: normal
    font-variant: normal
    font-weight: normal
    line-height: 1
    speak: none
    text-transform: none
    @content

{% for icon in icons -%}
=icon--{{icon.name}}
  +icon("\{{icon.code}}")
    @content

.icon
  &.-{{icon.name}}
    +icon--{{icon.name}}

{% endfor %}
