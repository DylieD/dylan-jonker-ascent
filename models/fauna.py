import sys
import os
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lib import *
reset()
out=[]
def put(parts,name):
    o=join(parts,'x') if isinstance(parts,list) else parts
    o.name=name; select_only(o); bpy.ops.object.transform_apply(location=True); out.append(o); return o
BR=0x4d3a2c
# ---- cliff pine: grows out of the wall (wall at y=0, out toward -Y), bends up
t=[tube('tr',[(0,0.2,0),(0.05,-0.8,0.25),(0.2,-1.7,1.1),(0.0,-2.2,2.5),(-0.1,-2.3,3.6)],0.26,BR,seg=8),
   tube('b1',[(0.1,-1.7,1.1),(1.3,-2.3,1.7),(2.3,-2.6,2.5)],0.14,BR,seg=6),
   tube('b2',[(0.05,-2.1,2.2),(-1.3,-2.5,2.8),(-2.4,-2.7,3.4)],0.13,BR,seg=6),
   tube('b3',[(0.2,-1.5,0.8),(-1.0,-1.9,1.0),(-1.9,-2.0,0.5)],0.1,BR,seg=6),
   noise_rock('root',0.9,3,0x8a6f58,flat=True,detail=2,squash=0.5,jit=0.2)]
t[-1].location=(0,-0.2,0.1)
for (x,y,z,s,c) in [(0,-2.4,4.0,1.35,0x2f7a52),(-2.4,-2.7,3.5,1.0,0x276a47),(2.3,-2.7,2.7,1.05,0x3a8d5c),(-0.3,-2.5,3.0,1.0,0x2a6f4b),(-1.9,-2.1,0.7,0.75,0x34805a),(0.9,-2.6,3.7,0.9,0x409a63)]:
    t.append(sphere('c',1.0,loc=(x,y,z),scale=(s*1.15,s*0.8,s*0.7),col=c,seg=10,rings=6,jitter=0.14))
put(t,'cliff_tree')
# ---- bird: nose +X, wings out along +/-Y (origin at shoulders), body origin at centre
BD=0x2b2f3a; BL=0xd9d4c7; BE=0xff9a1f; WG=0x3a4152
b=[sphere('body',0.2,loc=(0,0,0),scale=(1.5,0.85,0.8),col=BD,seg=10,rings=7),
   sphere('belly',0.17,loc=(0.02,0,-0.05),scale=(1.3,0.8,0.6),col=BL,seg=8,rings=6),
   sphere('head',0.14,loc=(0.32,0,0.07),col=BD,seg=8,rings=6),
   cyl('beak',0.05,0.0,0.22,loc=(0.5,0,0.05),rot=(0,1.5708,0),col=BE,seg=6),
   box('tail',(0.3,0.16,0.02),loc=(-0.42,0,0.0),rot=(0,0,0),col=BD,bevel=0.004,native=True,taper=None),
   sphere('eye',0.03,loc=(0.4,0.07,0.1),col=0xffffff,seg=6,rings=4),
   sphere('eye2',0.03,loc=(0.4,-0.07,0.1),col=0xffffff,seg=6,rings=4)]
put(b,'bird_body')
for nm,sg in (('bird_wL',1),('bird_wR',-1)):
    w=[box('w',(0.34,0.62,0.025),loc=(0,sg*0.32,0.03),col=WG,bevel=0.006,native=True),
       box('w2',(0.2,0.3,0.02),loc=(-0.03,sg*0.74,0.02),col=0x2b2f3a,bevel=0.004,native=True)]
    o=put(w,nm); set_origin(o,(0,sg*0.05,0.04))
export(os.path.join(HERE, 'fauna_raw.glb'),out)
print('ok')
