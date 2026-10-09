import sys
import os
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lib import *
reset()
OR=0xff6a2b; TL=0x1f8a8a; TD=0x145a5e; BK=0x1a1a1e; WH=0xf4f1ea; SK=0xd2a074; GY=0x9aa0a6; YL=0xffc83d

def bn(n,size,loc,col,rot=(0,0,0),bevel=0.02): return box(n,size,loc=loc,rot=rot,col=col,bevel=bevel,native=True)

# ---------------- torso (origin at hips)
t=[]
t.append(bn('jacket',(0.64,0.36,0.74),(0,0,0.42),TL,bevel=0.07))
t.append(bn('chest',(0.5,0.1,0.3),(0,0.2,0.55),TD,bevel=0.04))
t.append(bn('panel',(0.18,0.02,0.5),(0.0,0.2,0.4),OR,bevel=0.005))
t.append(cyl('neck',0.09,0.09,0.12,loc=(0,0,0.82),col=SK,seg=8))
t.append(cyl('collar',0.2,0.17,0.08,loc=(0,0,0.78),col=TD,seg=10))
# harness
t.append(cyl('belt',0.35,0.35,0.1,loc=(0,0,0.04),col=OR,seg=14,smooth=True))
for s in (-1,1):
    t.append(bn('loop',(0.2,0.2,0.1),(s*0.16,0.02,-0.12),OR,bevel=0.03))
    t.append(bn('strap',(0.06,0.06,0.34),(s*0.2,0.14,0.28),BK,bevel=0.01))
# gear loops + carabiners
for i,s in enumerate((-1,1)):
    t.append(torus('cb',0.06,0.012,loc=(s*0.3,0.12,0.05),rot=(math.pi/2,0,0),col=GY,seg=10,rseg=5))
# chalk bag + backpack on the back
t.append(cyl('chalk',0.13,0.17,0.26,loc=(0.12,-0.28,0.02),rot=(0.2,0,0),col=WH,seg=10))
t.append(cyl('chalk_top',0.12,0.12,0.04,loc=(0.12,-0.3,0.17),rot=(0.2,0,0),col=OR,seg=10))
t.append(bn('pack',(0.5,0.22,0.58),(0,-0.29,0.5),TD,bevel=0.07))
t.append(bn('pack_lid',(0.46,0.24,0.14),(0,-0.29,0.82),OR,bevel=0.04))
t.append(torus('rope',0.19,0.045,loc=(0,-0.42,0.5),rot=(math.pi/2,0,0),col=YL,seg=16,rseg=6))
for s in (-1,1): t.append(bn('pstrap',(0.07,0.32,0.06),(s*0.2,-0.02,0.74),BK,bevel=0.01))
torso=join(t,'torso'); set_origin(torso,(0,0,0))

# ---------------- head (origin at neck)
h=[]
h.append(sphere('skull',0.17,loc=(0,0,0.95),scale=(1,1.05,1.1),col=SK,seg=12,rings=8))
h.append(sphere('helmet',0.205,loc=(0,-0.01,0.99),scale=(1,1.08,0.95),col=OR,seg=14,rings=8))
h.append(bn('brim',(0.34,0.14,0.03),(0,0.13,0.93),OR,bevel=0.01))
h.append(bn('vent',(0.05,0.28,0.04),(0,0,1.18),WH,bevel=0.01))
h.append(bn('lamp',(0.1,0.05,0.07),(0,0.2,1.05),YL,bevel=0.01))
h.append(bn('band',(0.4,0.3,0.03),(0,0,1.02),BK,bevel=0.005))
head=join(h,'head'); set_origin(head,(0,0,0.84))

# ---------------- limbs: origin at the top joint, geometry along -Z
def limb(name,top,length,r1,r2,col,extra=None):
    parts=[cyl('seg',r1,r2,length,loc=(top[0],top[1],top[2]-length/2),col=col,seg=8)]
    if extra: parts+=extra(top,length)
    o=join(parts,name); set_origin(o,top); return o

def glove(top,L):
    z=top[2]-L
    return [sphere('palm',0.095,loc=(top[0],top[1]+0.01,z-0.02),scale=(1,1,1.1),col=BK,seg=8,rings=6),
            bn('cuff',(0.13,0.13,0.08),(top[0],top[1],top[2]-L+0.12),OR,bevel=0.02)]
def shoe(top,L):
    z=top[2]-L
    return [bn('shoe',(0.17,0.34,0.14),(top[0],top[1]+0.1,z-0.02),BK,bevel=0.04),
            bn('toe',(0.16,0.12,0.12),(top[0],top[1]+0.26,z-0.02),OR,bevel=0.04),
            bn('sole',(0.18,0.36,0.03),(top[0],top[1]+0.1,z-0.08),WH,bevel=0.01)]
def kneepad(top,L): return [bn('kp',(0.16,0.1,0.16),(top[0],top[1]+0.07,top[2]-0.02),TD,bevel=0.04)]

nodes=[torso,head]
for s,tag in ((-1,'L'),(1,'R')):
    sh=(s*0.34,0,0.72)
    nodes.append(limb('up_'+tag,sh,0.42,0.085,0.07,TL))
    nodes.append(limb('lo_'+tag,(sh[0],0,0.72-0.42),0.45,0.07,0.06,OR,glove))
    hip=(s*0.16,0,0.0)
    nodes.append(limb('th_'+tag,hip,0.55,0.13,0.1,TD))
    nodes.append(limb('sh_'+tag,(hip[0],0,-0.55),0.55,0.1,0.075,TD,lambda t,L: shoe(t,L)+kneepad(t,0)))
export(os.path.join(HERE, 'climber_raw.glb'),nodes)
print('climber ok')
