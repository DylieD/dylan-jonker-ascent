import sys
import os
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lib import *
reset()
W=0xf2f2f2
out=[]
def put(o,name): o.name=name; select_only(o); bpy.ops.object.transform_apply(location=True); out.append(o); return o
def blob(name,r,scale,loc,col=W,seg=14,rings=9,sub=0):
    return sphere(name,r,loc=loc,scale=scale,col=col,seg=seg,rings=rings)
# jug: fat bulb with a deep hand-sized hollow suggested by a darker dish
j=[blob('b',0.3,(1.15,0.8,0.8),(0,-0.18,0)),
   blob('d',0.16,(1.1,0.5,0.9),(0,-0.36,0.07),col=0xbdbdbd,seg=10,rings=6),
   box('base',(0.5,0.1,0.34),loc=(0,-0.04,-0.02),col=W,native=True,bevel=0.04)]
put(join(j,'x'),'hold_jug')
# crimp: thin shelf with a sharp edge
c=[box('s',(0.62,0.2,0.14),loc=(0,-0.1,0),col=W,native=True,bevel=0.035),
   box('e',(0.58,0.08,0.05),loc=(0,-0.23,0.03),col=0xdddddd,native=True,bevel=0.015)]
put(join(c,'x'),'hold_crimp')
# sloper: big shallow dome
s=[blob('d',0.42,(1.0,0.55,0.8),(0,-0.1,0.0),seg=16,rings=10),
   blob('c',0.18,(1,0.4,1),(0,-0.26,0.02),col=0xdcdcdc,seg=8,rings=5)]
put(join(s,'x'),'hold_sloper')
# pinch: upright blade
p=[box('b',(0.17,0.34,0.5),loc=(0,-0.17,0),col=W,native=True,bevel=0.05),
   box('t',(0.12,0.12,0.38),loc=(0,-0.3,0.02),col=0xdddddd,native=True,bevel=0.03)]
put(join(p,'x'),'hold_pinch')
# volume bolt-on foot chip
f=[blob('f',0.2,(1,0.6,0.5),(0,-0.08,0))]
put(join(f,'x'),'hold_foot')
export(os.path.join(HERE, 'holds_raw.glb'),out)
print('ok')
