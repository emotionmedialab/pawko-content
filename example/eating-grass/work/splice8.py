s = open('web/story.js', encoding='utf8').read()
x = "glide(1044, 1082, C([-0.5, 1.0, BR.z + 0.55], [-0.58, 0.0, BR.z], 40), C([-0.52, 0.98, BR.z + 0.5], [-0.6, 0.0, BR.z], 40))(f)"
assert x in s
s = s.replace(x, "glide(1044, 1082, C([-0.1, 1.0, BR.z + 0.55], [-0.18, 0.0, BR.z], 40), C([-0.55, 0.98, BR.z + 0.5], [-0.62, 0.0, BR.z], 40))(f)")
open('web/story.js', 'w', encoding='utf8').write(s); print('ok')
