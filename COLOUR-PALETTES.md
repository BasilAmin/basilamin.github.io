# Colour Palettes

The website ships with three complete palette families. Each family has a dark and light mode, and every colour is defined through the same CSS variables.

Change one line in `site.config.mjs`:

```js
palette: "foundry"
```

## Foundry — recommended

Foundry uses carbon-black, warm parchment, oxidised clay, and quiet moss. It matches the site’s subject matter without turning it into a generic dark engineering interface. The dark mode is dramatic without using pure black; the light mode reads like uncoated paper rather than a white dashboard.

```text
Dark background      #0b0b0a
Dark strong text     #f3ecdf
Dark accent          #d07a58
Light background     #f5f1e8
Light strong text    #171411
Light accent         #7a3827
```

## Merlot

Merlot shifts the neutrals toward blackened plum and the accent toward garnet. It is the most editorial and expressive option. It works well when you want the site to feel more like an independent journal, but it is slightly less neutral around technical project work.

```text
Dark background      #100d0f
Dark strong text     #f4ece6
Dark accent          #d17a6e
Light background     #f5efea
Light strong text    #1b1516
Light accent         #77332e
```

## Graphite

Graphite is the most restrained option: warm charcoal, chalk, rust, and muted green. It has the least stylistic bias and the cleanest utilitarian feel, but it is also the least distinctive of the three.

```text
Dark background      #0c0d0c
Dark strong text     #f1efe8
Dark accent          #c7795b
Light background     #f2f1ec
Light strong text    #151613
Light accent         #723b2a
```

## Recommendation

Use Foundry. It preserves the character of the original warm palette, gives the italic display type enough contrast, avoids the predictable blue-and-black technology look, and remains comfortable for articles and logs in both modes.
