#!/bin/bash

set -eu

declare -A languages
defaultLanguage="en-US"

# Supported languages
languages=(
    ["ar"]="ar"
    ["en"]="en-US"
    ["vi"]="vi-VN"
    ["hu"]="hu-HU"
    ["th"]="th-TH"
    ["fi"]="fi-FI"
    ["nl"]="nl-NL"
    ["gd"]="gd"
    ["el"]="el-GR"
    ["es"]="es-ES"
    ["oc"]="oc"
    ["pt"]="pt-BR"
    ["pt-PT"]="pt-PT"
    ["sv"]="sv-SE"
    ["pl"]="pl-PL"
    ["ru"]="ru-RU"
    ["zh-Hans"]="zh-Hans-CN"
    ["zh-Hant"]="zh-Hant-TW"
    ["fr"]="fr-FR"
    ["ja"]="ja-JP"
    ["eu"]="eu-ES"
    ["ca"]="ca-ES"
    ["gl"]="gl-ES"
    ["cs"]="cs-CZ"
    ["eo"]="eo"
    ["de"]="de-DE"
    ["it"]="it-IT"
    ["kab"]="kab"
)

cd client

rm -rf ./dist ./compiled

# Don't build other languages if --light arg is provided
<<<<<<< Updated upstream
if [ -z ${1+x} ] || [ "$1" != "--light" ]; then
    if [ ! -z ${1+x} ] && [ "$1" == "--light-hu" ]; then
        languages=(["hu"]="hu-HU")
    elif [ ! -z ${1+x} ] && [ "$1" == "--light-th" ]; then
        languages=(["th"]="th-TH")
    elif [ ! -z ${1+x} ] && [ "$1" == "--light-fi" ]; then
        languages=(["fi"]="fi-FI")
    elif [ ! -z ${1+x} ] && [ "$1" == "--light-nl" ]; then
        languages=(["nl"]="nl-NL")
    elif [ ! -z ${1+x} ] && [ "$1" == "--light-gd" ]; then
        languages=(["gd"]="gd")
    elif [ ! -z ${1+x} ] && [ "$1" == "--light-el" ]; then
        languages=(["el"]="el-GR")
    elif [ ! -z ${1+x} ] && [ "$1" == "--light-es" ]; then
        languages=(["es"]="es-ES")
    elif [ ! -z ${1+x} ] && [ "$1" == "--light-pt" ]; then
        languages=(["pt"]="pt-BR")
    elif [ ! -z ${1+x} ] && [ "$1" == "--light-pt-PT" ]; then
        languages=(["pt-PT"]="pt-PT")
    elif [ ! -z ${1+x} ] && [ "$1" == "--light-sv" ]; then
        languages=(["sv"]="sv-SE")
    elif [ ! -z ${1+x} ] && [ "$1" == "--light-pl" ]; then
        languages=(["pl"]="pl-PL")
    elif [ ! -z ${1+x} ] && [ "$1" == "--light-ru" ]; then
        languages=(["ru"]="ru-RU")
    elif [ ! -z ${1+x} ] && [ "$1" == "--light-zh-Hans" ]; then
        languages=(["zh-Hans"]="zh-Hans-CN")
    elif [ ! -z ${1+x} ] && [ "$1" == "--light-zh-Hant" ]; then
        languages=(["zh-Hant"]="zh-Hant-TW")
    elif [ ! -z ${1+x} ] && [ "$1" == "--light-fr" ]; then
        languages=(["fr"]="fr-FR")
    elif [ ! -z ${1+x} ] && [ "$1" == "--light-ja" ]; then
        languages=(["ja"]="ja-JP")
    elif [ ! -z ${1+x} ] && [ "$1" == "--light-eu" ]; then
        languages=(["eu"]="eu-ES")
    elif [ ! -z ${1+x} ] && [ "$1" == "--light-ca" ]; then
        languages=(["ca"]="ca-ES")
    elif [ ! -z ${1+x} ] && [ "$1" == "--light-cs" ]; then
        languages=(["cs"]="cs-CZ")
    elif [ ! -z ${1+x} ] && [ "$1" == "--light-eo" ]; then
        languages=(["eo"]="eo")
    elif [ ! -z ${1+x} ] && [ "$1" == "--light-de" ]; then
        languages=(["de"]="de-DE")
    elif [ ! -z ${1+x} ] && [ "$1" == "--light-it" ]; then
        languages=(["it"]="it-IT")
    else
        # Supported languages
        languages=(
            ["hu"]="hu-HU"
            ["th"]="th-TH"
            ["fi"]="fi-FI"
            ["nl"]="nl-NL"
            ["gd"]="gd"
            ["el"]="el-GR"
            ["es"]="es-ES"
            ["pt"]="pt-BR"
            ["pt-PT"]="pt-PT"
            ["sv"]="sv-SE"
            ["pl"]="pl-PL"
            ["ru"]="ru-RU"
            ["zh-Hans"]="zh-Hans-CN"
            ["zh-Hant"]="zh-Hant-TW"
            ["fr"]="fr-FR"
            ["ja"]="ja-JP"
            ["eu"]="eu-ES"
            ["ca"]="ca-ES"
            ["cs"]="cs-CZ"
            ["eo"]="eo"
            ["de"]="de-DE"
            ["it"]="it-IT"
        )
    fi
=======
if [ -z ${1+x} ] || ([ "$1" != "--light" ] && [ "$1" != "--analyze-bundle" ]); then
    npm run ng build -- --prod --output-path "dist/build"
>>>>>>> Stashed changes

    for key in "${!languages[@]}"; do
        lang=${languages[$key]}

        mv "dist/build/$key" "dist/$lang"

        if [ "$lang" != "en-US" ]; then
            # Do not duplicate assets
            rm -r "./dist/$lang/assets"
        fi
    done

    mv "./dist/$defaultLanguage/assets" "./dist"
    mv "./dist/$defaultLanguage/manifest.webmanifest" "./dist/manifest.webmanifest"

    rmdir "dist/build"
else
    additionalParams=""
    if [ ! -z ${1+x} ] && [ "$1" == "--analyze-bundle" ]; then
        additionalParams="--namedChunks=true --outputHashing=none"
        export ANALYZE_BUNDLE=true
    fi

    npm run ng build -- --localize=false --output-path "dist/$defaultLanguage/" --deploy-url "/client/$defaultLanguage/" --prod --stats-json $additionalParams
fi

cd ../ && npm run build:embed && cd client/

# Copy runtime locales
cp -r "./src/locale" "./dist/locale"
