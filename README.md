# zona-prop-scraping

Scraper de Zonaprop.

## Modo de uso:

1. Instalar las dependencias declaradas en el archivo `pyproject.toml`:

Con pip:

```bash
uv sync
```

2. Activar el entorno virtual

```bash
# Linux y MacOS
source .venv/bin/activate
```

3. Ejecutar el script `zonaprop-scraping.py` pasando como argumento la url de la página de Zonaprop que se desea scrapear (por default se utilizará la url: https://www.zonaprop.com.ar/departamentos-alquiler.html):

```bash
python zonaprop-scraping.py <url>
```

Por ejemplo:

```bash
python zonaprop-scraping.py https://www.zonaprop.com.ar/departamentos-alquiler.html
```

4. El script generará un archivo `.csv` en el directorio `data` con los datos de los inmuebles obtenidos.

## Análisis de los datos:

Se puede ver un análisis de los datos obtenidos por el scraper en el archivo `/analysis/exploratory-analysis.ipynb`.

Tomar este análisis como un ejemplo de cómo se puede utilizar el scraper para obtener datos y analizarlos.
