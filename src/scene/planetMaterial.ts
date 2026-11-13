import { Color, ShaderMaterial } from 'three';

const noise = `
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,v=0.;for(int i=0;i<6;i++){v+=a*noise(p);p=p*2.04+vec3(3.1,1.7,2.8);a*=.5;}return v;}
`;

export const planetMaterial = (color: string, seed: number) => {
  return new ShaderMaterial({
    uniforms: {
      color: { value: new Color(color) },
      seed: { value: seed },
      time: { value: 0 },
    },
    vertexShader: `varying vec3 vP;varying vec3 vN;varying vec3 vV;void main(){vP=position;vN=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);vV=-p.xyz;gl_Position=projectionMatrix*p;}`,
    fragmentShader: `precision highp float;uniform vec3 color;uniform float seed;uniform float time;varying vec3 vP;varying vec3 vN;varying vec3 vV;${noise}
void main(){vec3 p=normalize(vP);p+=seed*2.;vec3 warp=vec3(fbm(p*3.),fbm(p*3.+7.),fbm(p*3.+17.));float clouds=fbm(p*8.+warp*6.);float bands=sin(p.y*22.+warp.x*14.+clouds*8.);float detail=fbm(p*65.+warp*5.);float f=clamp(clouds*.9+bands*.14+detail*.2,0.,1.);vec3 dark=color*.24;vec3 bright=mix(color,vec3(1.,.91,.76),.58);vec3 surface=mix(dark,color,smoothstep(.22,.64,f));surface=mix(surface,bright,smoothstep(.57,.78,f));surface*=.85+detail*.35;vec3 n=normalize(vN);float light=max(dot(n,normalize(vec3(-.7,.65,1.))),0.);float rim=pow(1.-max(dot(n,normalize(vV)),0.),3.5);vec3 c=surface*(.055+1.35*pow(light,1.4));c+=color*rim*.22*light;gl_FragColor=vec4(c,1.);}`,
  });
};
