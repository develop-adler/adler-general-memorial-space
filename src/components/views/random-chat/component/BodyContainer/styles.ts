import { styled } from "@mui/material";

export const Body = styled("div")({
    position: 'relative',
    width: '87.64dvw',
    height: '66.34dvh',
    maxWidth: '1518px',
    maxHeight: '698px',
    borderRadius: '32px',
    border: '2px solid #FFF',
    background: 'rgba(248, 250, 255, 0.70)',
    display: 'flex',
});

export const BodyFilterFirst = styled("div")({
    position: 'absolute',
    left: '-121px',
    bottom: '-180px',
    width: '668px',
    height: '512px',
    borderRadius: '668px',
    background: 'rgba(230, 65, 123, 0.07)',
    filter: 'blur(85.6097640991211px)'
});

export const BodyFilterSecond = styled("div")({
    position: 'absolute',
    bottom: '-36px',
    left: '22px',
    width: '820px',
    height: '564px',
    borderRadius: '820px',
    background: 'rgba(230, 65, 123, 0.10)',
    filter: 'blur(85.6097640991211px)',
});

export const BodyFilterThird = styled("div")({
    position: 'absolute',
    top: '18px',
    right: '0px',
    width: '820px',
    height: '564px',
    flexShrink: 0,
    borderRadius: '820px',
    background: 'rgba(230, 65, 123, 0.10)',
    filter: 'blur(85.6097640991211px)'
});