export const clamp=value=>Math.max(0,Math.min(1,value));
export function separationAt(top,height,viewport){
  return clamp(-top/Math.max(1,height-viewport));
}
const smooth=value=>value*value*(3-2*value);
export function flightAt(top,height,viewport){
  const entering=1-smooth(clamp((viewport-top)/(viewport*.65)));
  const leaving=smooth(clamp((height*.4-top)/Math.max(1,height*1.4)));
  return entering-leaving;
}
export function follow(current,target,seconds){
  const next=current+(target-current)*(1-Math.exp(-Math.min(seconds,1/30)/.16));
  return Math.abs(next-target)<.0001?target:next;
}
