import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import CourseCard from "../components/CourseCard";
import { fetchUsers } from "../store/usersSlice";

export default function FriendCourses() {
  const dispatch = useDispatch();
  const friends = useSelector((state) => state.users.items).filter((user) => user.isFriend);
  const friendIds = new Set(friends.map((friend) => friend.id));
  const courses = useSelector((state) => state.courses.items).filter((course) => course.owner?.id && friendIds.has(course.owner.id));

  useEffect(() => {
    dispatch(fetchUsers(""));
  }, [dispatch]);

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Friend courses</p>
          <h1>Courses shared by your friends</h1>
        </div>
      </div>
      {courses.length === 0 ? <div className="empty-state"><h2>No friend courses</h2><p>Add friends or wait for them to create courses.</p></div> : (
        <div className="course-grid">{courses.map((course) => <CourseCard key={course.id} course={course} />)}</div>
      )}
    </section>
  );
}
