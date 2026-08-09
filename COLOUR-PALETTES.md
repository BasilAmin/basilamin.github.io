# Colour Palette

The website ships with one focused palette in matched dark and light modes. Every colour is defined through shared CSS variables.

Change one line in `site.config.mjs`:

```js
palette: "foundry"
```

## Foundry

Foundry uses carbon-black, warm parchment, oxidised clay, and quiet moss. It matches the site’s subject matter without turning it into a generic dark engineering interface. The dark mode is dramatic without using pure black; the light mode reads like uncoated paper rather than a white dashboard.

```text
Dark background      #070b10
Dark strong text     #f3f8fb
Dark orange          #ff6a00
Dark blue            #31a9ff
Light background     #eef4f7
Light strong text    #071722
Light orange         #db5700
Light blue           #0078c8
```

Foundry preserves the character of the original warm palette, gives the italic display type enough contrast, avoids the predictable blue-and-black technology look, and remains comfortable for articles and logs in both modes.
