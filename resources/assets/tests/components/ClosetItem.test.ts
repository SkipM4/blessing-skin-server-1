import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { flushPromises } from '../utils'
import { showModal } from '@/scripts/notify'
import ClosetItem from '@/components/ClosetItem.vue'

jest.mock('@/scripts/notify')

function factory(opt = {}) {
  return {
    tid: 1,
    name: 'texture',
    type: 'steve',
    ...opt,
  }
}

test('computed values', () => {
  const wrapper = mount(ClosetItem, { propsData: factory() })
  expect(wrapper.find('img').attributes('src')).toBe('/preview/1.png')
  expect(
    wrapper
      .findAll('.dropdown-item')
      .at(2)
      .attributes('href'),
  ).toBe('/skinlib/show/1')
})

test('selected item', () => {
  const wrapper = mount(ClosetItem, { propsData: factory({ selected: true }) })
  expect(wrapper.find('.card').classes('shadow')).toBeTrue()
})

test('click item body', () => {
  const wrapper = mount(ClosetItem, { propsData: factory() })

  wrapper.find('.card').trigger('click')
  expect(wrapper.emitted().select).toBeUndefined()

  wrapper.find('.card-body').trigger('click')
  expect(wrapper.emitted().select).toBeTruthy()
})

test('rename texture', async () => {
  Vue.prototype.$http.post
    .mockResolvedValueOnce({ code: 0 })
    .mockResolvedValueOnce({ code: 1 })
  showModal
    .mockRejectedValueOnce(null)
    .mockResolvedValue({ value: 'new-name' })
  const wrapper = mount(ClosetItem, { propsData: factory() })
  const button = wrapper.findAll('.dropdown-item').at(0)

  button.trigger('click')
  await flushPromises()
  expect(Vue.prototype.$http.post).not.toBeCalled()

  // Warning message
  button.trigger('click')
  await flushPromises()

  button.trigger('click')
  await flushPromises()
  expect(wrapper.find('[data-test="name"]').text()).toBe('new-name (steve)')
  expect(Vue.prototype.$http.post).toBeCalledWith(
    '/user/closet/rename/1',
    { name: 'new-name' },
  )
})

test('remove texture', async () => {
  Vue.prototype.$http.post
    .mockResolvedValueOnce({ code: 0 })
    .mockResolvedValueOnce({ code: 1 })
  showModal
    .mockRejectedValueOnce(null)
    .mockResolvedValue({ value: '' })

  const wrapper = mount(ClosetItem, { propsData: factory() })
  const button = wrapper.findAll('.dropdown-item').at(1)

  button.trigger('click')
  await flushPromises()
  expect(Vue.prototype.$http.post).not.toBeCalled()

  button.trigger('click')
  await flushPromises()

  button.trigger('click')
  await flushPromises()
  expect(wrapper.emitted()['item-removed']).toBeTruthy()
  expect(Vue.prototype.$http.post).toBeCalledWith('/user/closet/remove/1')
})

test('set as avatar', async () => {
  Vue.prototype.$http.post
    .mockResolvedValueOnce({ code: 0 })
    .mockResolvedValueOnce({ code: 1 })
  showModal
    .mockRejectedValueOnce(null)
    .mockResolvedValue({ value: '' })

  const wrapper = mount(ClosetItem, { propsData: factory() })
  const button = wrapper.findAll('.dropdown-item').at(3)
  document.body.innerHTML += '<img alt="User Image" src="a">'

  button.trigger('click')
  await flushPromises()
  expect(Vue.prototype.$http.post).not.toBeCalled()

  button.trigger('click')
  await flushPromises()

  button.trigger('click')
  await flushPromises()
  await flushPromises()
  expect(Vue.prototype.$http.post).toBeCalledWith('/user/profile/avatar', { tid: 1 })
  expect(document.querySelector('img')!.src).toMatch(/\d+$/)
})

test('no avatar option if texture is cape', () => {
  const wrapper = mount(ClosetItem, { propsData: factory({ type: 'cape' }) })
  expect(wrapper.findAll('.dropdown-item')).toHaveLength(3)
})

test('truncate too long texture name', () => {
  const wrapper = mount(ClosetItem, {
    propsData: factory({ name: 'very-very-long-texture-name' }),
  })
  expect(wrapper.text()).toContain('very-very-long-...')
})
